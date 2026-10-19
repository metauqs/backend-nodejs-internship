const mongoose = require('mongoose');

const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const KhataEntry = require('../models/KhataEntry');
const Budget = require('../models/Budget');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { monthRange } = require('../utils/date');
const { serialize } = require('../utils/serialize');

const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

function sumTypes(rows, types) {
    return rows
        .filter((row) => types.includes(row._id))
        .reduce((total, row) => total + row.total, 0);
}

async function summary(userId, month, year) {
    const now = new Date();
    const selectedMonth = Number(month || now.getUTCMonth() + 1);
    const selectedYear = Number(year || now.getUTCFullYear());
    const range = monthRange(selectedYear, selectedMonth);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

    const [accountTotals, transactionTotals, khataTotals, budget] = await Promise.all([
        Account.aggregate([
            { $match: { user: userObjectId } },
            {
                $group: {
                    _id: null,
                    totalBalance: { $sum: '$balance' },
                },
            },
        ]),
        Transaction.aggregate([
            {
                $match: {
                    user: userObjectId,
                    date: { $gte: range.start, $lt: range.end },
                },
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                },
            },
        ]),
        KhataEntry.aggregate([
            {
                $match: {
                    user: userObjectId,
                    status: { $ne: 'settled' },
                },
            },
            {
                $group: {
                    _id: '$type',
                    remaining: { $sum: '$remainingAmount' },
                },
            },
        ]),
        Budget.findOne({ user: userId, monthKey }),
    ]);

    const monthlyIncome = sumTypes(transactionTotals, ['income']);
    const monthlyExpense = sumTypes(transactionTotals, ['expense', 'subscription']);
    const lendTotal = khataTotals.find((row) => row._id === 'lend')?.remaining || 0;
    const borrowTotal = khataTotals.find((row) => row._id === 'borrow')?.remaining || 0;
    const monthlyBudget = (budget?.amount !== undefined && budget?.amount !== null)
        ? budget.amount
        : 0;

    // Keep compatibility aliases because the existing UI uses more than one name.
    return {
        totalBalance: accountTotals[0]?.totalBalance || 0,
        monthlyIncome,
        monthlyExpense,
        monthlySpend: monthlyExpense,
        totalIncome: monthlyIncome,
        totalExpense: monthlyExpense,
        creditBalance: lendTotal - borrowTotal,
        monthlyBudget,
        budgetRemaining: Math.max(0, monthlyBudget - monthlyExpense),
        isBudgetExceeded: monthlyBudget > 0 && monthlyExpense > monthlyBudget,
        month: selectedMonth,
        year: selectedYear,
    };
}

async function stats(userId, year, month) {
    const now = new Date();
    const selectedYear = Number(year || now.getUTCFullYear());
    const selectedMonth = Number(month || now.getUTCMonth() + 1);

    if (!Number.isInteger(selectedYear) || selectedYear < 1970 || selectedYear > 2200) {
        throw new ApiError(400, 'Invalid year');
    }

    const activeRange = monthRange(selectedYear, selectedMonth);
    const yearStart = new Date(Date.UTC(selectedYear, 0, 1));
    const yearEnd = new Date(Date.UTC(selectedYear + 1, 0, 1));
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [monthlyTotals, dailyTotals] = await Promise.all([
        Transaction.aggregate([
            {
                $match: {
                    user: userObjectId,
                    type: { $in: ['expense', 'subscription'] },
                    date: { $gte: yearStart, $lt: yearEnd },
                },
            },
            {
                $group: {
                    _id: { $month: '$date' },
                    amount: { $sum: '$amount' },
                    txCount: { $sum: 1 },
                },
            },
        ]),
        Transaction.aggregate([
            {
                $match: {
                    user: userObjectId,
                    type: { $in: ['expense', 'subscription'] },
                    date: { $gte: activeRange.start, $lt: activeRange.end },
                },
            },
            {
                $group: {
                    _id: { $dayOfMonth: '$date' },
                    amount: { $sum: '$amount' },
                    items: {
                        $push: {
                            id: '$_id',
                            title: '$title',
                            amount: '$amount',
                            category: '$category',
                            date: '$date',
                        },
                    },
                },
            },
            { $sort: { _id: 1 } },
        ]),
    ]);

    const monthlyByNumber = new Map(monthlyTotals.map((row) => [row._id, row]));
    const monthlyData = MONTH_NAMES.map((fullMonth, index) => {
        const row = monthlyByNumber.get(index + 1);

        return {
            month: fullMonth.slice(0, 3),
            fullMonth,
            amount: row?.amount || 0,
            txCount: row?.txCount || 0,
        };
    });

    const dailyByNumber = new Map(dailyTotals.map((row) => [row._id, row]));
    const daysInMonth = new Date(Date.UTC(selectedYear, selectedMonth, 0)).getUTCDate();
    const dailyData = Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const row = dailyByNumber.get(day);

        return {
            day,
            dateLabel: `${MONTH_NAMES[selectedMonth - 1].slice(0, 3)} ${day}`,
            amount: row?.amount || 0,
            isPeak: false,
            items: (row?.items || []).map((item) => ({
                ...item,
                id: String(item.id),
                _id: String(item.id),
            })),
        };
    });

    const peakAmount = dailyData.reduce(
        (highest, day) => Math.max(highest, day.amount),
        0
    );
    dailyData.forEach((day) => {
        day.isPeak = peakAmount > 0 && day.amount === peakAmount;
    });

    // Both aliases are returned because the audit found consumers using both names.
    return {
        year: selectedYear,
        month: selectedMonth,
        monthlyData,
        dailyData,
        months: monthlyData,
        daily: dailyData,
    };
}

async function recent(userId, limit = 20) {
    const parsedLimit = Number.parseInt(limit, 10);
    const safeLimit = Number.isInteger(parsedLimit)
        ? Math.max(1, Math.min(100, parsedLimit))
        : 20;

    const transactions = await Transaction.find({ user: userId })
        .sort({ date: -1, createdAt: -1 })
        .limit(safeLimit);

    return transactions.map(serialize);
}

module.exports = {
    summary,
    stats,
    recent,
};

const mongoose = require('mongoose');

const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const User = require('../models/User');
const { monthRange } = require('../utils/date');
const ApiError = require('../utils/apiError');
const { sendEmail } = require('./emailService');

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[character]);
}

async function buildMonthlyReport(userId, year, month) {
    const range = monthRange(year, month);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [totals, categoryTotals, transactionCount, accountTotals] = await Promise.all([
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
        Transaction.aggregate([
            {
                $match: {
                    user: userObjectId,
                    type: { $in: ['expense', 'subscription'] },
                    date: { $gte: range.start, $lt: range.end },
                },
            },
            {
                $group: {
                    _id: '$category',
                    amount: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { amount: -1 } },
        ]),
        Transaction.countDocuments({
            user: userId,
            date: { $gte: range.start, $lt: range.end },
        }),
        Account.aggregate([
            { $match: { user: userObjectId } },
            {
                $group: {
                    _id: null,
                    totalBalance: { $sum: '$balance' },
                },
            },
        ]),
    ]);

    const income = totals.find((row) => row._id === 'income')?.total || 0;
    const expenses = totals
        .filter((row) => ['expense', 'subscription'].includes(row._id))
        .reduce((sum, row) => sum + row.total, 0);

    return {
        year: Number(year),
        month: Number(month),
        income,
        expenses,
        balance: income - expenses,
        totalBalance: accountTotals[0]?.totalBalance || 0,
        transactionCount,
        expensesByCategory: categoryTotals.map((row) => ({
            category: row._id,
            amount: row.amount,
            count: row.count,
        })),
    };
}

async function emailMonthlySummary(userId, month, year) {
    const report = await buildMonthlyReport(userId, Number(year), Number(month));
    const user = await User.findById(userId);

    if (!user) throw new ApiError(404, 'User not found');

    const monthName = new Date(Date.UTC(Number(year), Number(month) - 1, 1))
        .toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
    const categoryRows = report.expensesByCategory
        .map((row) => (
            `<li>${escapeHtml(row.category)}: ${user.currency} ${row.amount.toFixed(2)}</li>`
        ))
        .join('');

    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>${monthName} ${year} Summary</h2>
            <p>Income: <strong>${user.currency} ${report.income.toFixed(2)}</strong></p>
            <p>Expenses: <strong>${user.currency} ${report.expenses.toFixed(2)}</strong></p>
            <p>Net: <strong>${user.currency} ${report.balance.toFixed(2)}</strong></p>
            <h3>Expenses by category</h3>
            <ul>${categoryRows}</ul>
        </div>
    `;

    await sendEmail({
        to: user.email,
        subject: `${monthName} ${year} Expense Tracker Summary`,
        text: `Income: ${report.income}; Expenses: ${report.expenses}; Net balance: ${report.balance}`,
        html,
    });

    return report;
}

module.exports = {
    buildMonthlyReport,
    emailMonthlySummary,
};

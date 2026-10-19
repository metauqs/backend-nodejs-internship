const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const ApiError = require('../utils/apiError');

function validMonthKey(key) {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(key);
}

async function getMap(userId) {
    const [user, docs] = await Promise.all([
        User.findById(userId).select('monthlyBudget'),
        Budget.find({ user: userId }).sort({ monthKey: -1 }),
    ]);

    const defaultBudget = (user?.monthlyBudget && user.monthlyBudget > 0) ? user.monthlyBudget : 0;
    const budgets = Object.fromEntries(docs.map((d) => [d.monthKey, d.amount]));

    return {
        budgets,
        defaultBudget,
        monthlyBudget: defaultBudget,
        items: docs,
    };
}

async function getOne(userId, monthKey) {
    if (!validMonthKey(monthKey)) {
        throw new ApiError(400, 'monthKey must use YYYY-MM format');
    }

    const [budget, year, month] = [
        await Budget.findOne({ user: userId, monthKey }),
        Number(monthKey.slice(0, 4)),
        Number(monthKey.slice(5, 7)),
    ];

    const amount = budget ? budget.amount : 0;

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const agg = await Transaction.aggregate([
        {
            $match: {
                user: userId,
                type: { $in: ['expense', 'subscription'] },
                date: { $gte: start, $lt: end },
            },
        },
        {
            $group: {
                _id: null,
                spent: { $sum: '$amount' },
            },
        },
    ]);

    const spent = agg[0]?.spent || 0;

    return {
        monthKey,
        amount,
        budget: amount,
        defaultBudget: 0,
        currentSpent: spent,
        remaining: Math.max(0, amount - spent),
        isExceeded: spent > amount && amount > 0,
        exceededAmount: Math.max(0, spent - amount),
        percentSpent: amount > 0 ? Math.round((spent / amount) * 100) : 0,
    };
}

async function upsert(userId, monthKey, amount) {
    const n = Number(amount);
    if (!Number.isFinite(n) || n < 0) {
        throw new ApiError(400, 'Budget amount must be zero or greater');
    }

    // Default or unspecific month update
    if (!monthKey || monthKey === 'default') {
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: { monthlyBudget: n } },
            { new: true }
        );
        return {
            monthKey: 'default',
            amount: n,
            monthlyBudget: n,
            defaultBudget: n,
        };
    }

    if (!validMonthKey(monthKey)) {
        throw new ApiError(400, 'monthKey must use YYYY-MM format');
    }

    // Upsert into Budget collection on monthly basis
    const saved = await Budget.findOneAndUpdate(
        { user: userId, monthKey },
        {
            $set: { amount: n },
            $setOnInsert: { user: userId, monthKey },
        },
        { new: true, upsert: true, runValidators: true }
    );

    return saved;
}

module.exports = {
    getMap,
    getOne,
    upsert,
};

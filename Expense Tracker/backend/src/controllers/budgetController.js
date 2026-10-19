const budgetService = require('../services/budgetService');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
    const result = await budgetService.getMap(req.user._id);

    return res.status(200).json({
        success: true,
        message: 'Budgets fetched',
        data: result,
        defaultBudget: result.defaultBudget,
        monthlyBudget: result.monthlyBudget,
        budgetsByMonth: result.budgets,
        budgets: result.budgets,
    });
});

exports.get = asyncHandler(async (req, res) => {
    const budget = await budgetService.getOne(req.user._id, req.params.monthKey);
    return sendSuccess(res, 200, budget, 'Budget fetched');
});

exports.upsert = asyncHandler(async (req, res) => {
    const monthKey = req.params.monthKey || req.body?.monthKey;
    const amount = req.body?.amount;

    const budget = await budgetService.upsert(
        req.user._id,
        monthKey,
        amount
    );
    return sendSuccess(res, 200, budget, 'Budget saved');
});

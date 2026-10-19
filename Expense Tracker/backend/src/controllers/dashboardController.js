const dashboardService = require('../services/dashboardService');
const asyncHandler = require('../utils/asyncHandler');

exports.summary = asyncHandler(async (req, res) => {
    const summary = await dashboardService.summary(
        req.user._id,
        req.query.month,
        req.query.year
    );

    // Duplicate dashboard fields at the top level to support the existing UI.
    return res.status(200).json({
        success: true,
        message: 'Dashboard summary fetched',
        data: summary,
        ...summary,
    });
});

exports.stats = asyncHandler(async (req, res) => {
    const stats = await dashboardService.stats(
        req.user._id,
        req.query.year,
        req.query.month
    );

    return res.status(200).json({
        success: true,
        message: 'Dashboard stats fetched',
        data: stats,
        ...stats,
    });
});

exports.recent = asyncHandler(async (req, res) => {
    const transactions = await dashboardService.recent(
        req.user._id,
        req.query.limit
    );

    return res.status(200).json({
        success: true,
        message: 'Recent transactions fetched',
        data: transactions,
        transactions,
    });
});

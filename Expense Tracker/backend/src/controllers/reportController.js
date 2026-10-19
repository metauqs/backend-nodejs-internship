const reportService = require('../services/reportService');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

function getMonthYear(req) {
    const now = new Date();

    return {
        year: Number(req.query.year ?? req.body?.year ?? now.getUTCFullYear()),
        month: Number(req.query.month ?? req.body?.month ?? now.getUTCMonth() + 1),
    };
}

exports.monthly = asyncHandler(async (req, res) => {
    const { year, month } = getMonthYear(req);
    const report = await reportService.buildMonthlyReport(req.user._id, year, month);

    return res.status(200).json({
        success: true,
        message: 'Monthly report generated',
        report,
        data: { report },
    });
});

exports.emailSummary = asyncHandler(async (req, res) => {
    const { year, month } = getMonthYear(req);
    const report = await reportService.emailMonthlySummary(
        req.user._id,
        month,
        year
    );

    return res.status(200).json({
        success: true,
        message: 'Summary email sent successfully',
        report,
        data: { report },
    });
});

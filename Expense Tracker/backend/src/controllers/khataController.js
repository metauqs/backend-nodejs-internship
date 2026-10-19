const khataService = require('../services/khataService');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
    const entries = await khataService.list(req.user._id, req.query);

    return res.status(200).json({
        success: true,
        message: 'Khata entries fetched',
        data: entries,
        entries,
    });
});

exports.create = asyncHandler(async (req, res) => {
    const entry = await khataService.create(req.user._id, req.body);
    return sendSuccess(res, 201, entry, 'Khata entry created');
});

exports.get = asyncHandler(async (req, res) => {
    const entry = await khataService.getOne(req.user._id, req.params.id);
    return sendSuccess(res, 200, entry, 'Khata entry fetched');
});

exports.update = asyncHandler(async (req, res) => {
    const entry = await khataService.update(
        req.user._id,
        req.params.id,
        req.body
    );
    return sendSuccess(res, 200, entry, 'Khata entry updated');
});

exports.payment = asyncHandler(async (req, res) => {
    const entry = await khataService.payment(
        req.user._id,
        req.params.id,
        req.body
    );
    return sendSuccess(res, 200, entry, 'Payment recorded');
});

exports.summary = asyncHandler(async (req, res) => {
    const summary = await khataService.summary(req.user._id);
    return sendSuccess(res, 200, summary, 'Khata summary fetched');
});

exports.remove = asyncHandler(async (req, res) => {
    await khataService.remove(req.user._id, req.params.id);
    return sendSuccess(res, 200, null, 'Khata entry deleted');
});

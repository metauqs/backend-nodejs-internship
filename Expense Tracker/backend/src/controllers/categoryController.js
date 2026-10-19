const categoryService = require('../services/categoryService');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
    const categories = await categoryService.list(req.user._id, req.query.type);

    return res.status(200).json({
        success: true,
        message: 'Categories fetched',
        data: categories,
        categories,
    });
});

exports.create = asyncHandler(async (req, res) => {
    const category = await categoryService.create(req.user._id, req.body);
    return sendSuccess(res, 201, category, 'Category created');
});

exports.update = asyncHandler(async (req, res) => {
    const category = await categoryService.update(
        req.user._id,
        req.params.id,
        req.body
    );
    return sendSuccess(res, 200, category, 'Category updated');
});

exports.remove = asyncHandler(async (req, res) => {
    await categoryService.remove(req.user._id, req.params.id);
    return sendSuccess(res, 200, null, 'Category deleted');
});

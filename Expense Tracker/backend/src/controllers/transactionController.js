const transactionService = require('../services/transactionService');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
    const result = await transactionService.listTransactions(req.user._id, req.query);

    return sendSuccess(
        res,
        200,
        result.data,
        'Transactions fetched',
        { pagination: result.pagination }
    );
});

exports.all = asyncHandler(async (req, res) => {
    const transactions = await transactionService.listAllTransactions(req.user._id);
    return sendSuccess(res, 200, transactions, 'All transactions fetched');
});

exports.get = asyncHandler(async (req, res) => {
    const transaction = await transactionService.getTransaction(
        req.user._id,
        req.params.id
    );
    return sendSuccess(res, 200, transaction, 'Transaction fetched');
});

exports.create = asyncHandler(async (req, res) => {
    const transaction = await transactionService.createTransaction(
        req.user._id,
        req.body
    );
    return sendSuccess(res, 201, transaction, 'Transaction created successfully');
});

exports.update = asyncHandler(async (req, res) => {
    const transaction = await transactionService.updateTransaction(
        req.user._id,
        req.params.id,
        req.body
    );
    return sendSuccess(res, 200, transaction, 'Transaction updated successfully');
});

exports.remove = asyncHandler(async (req, res) => {
    await transactionService.deleteTransaction(req.user._id, req.params.id);
    return sendSuccess(res, 200, null, 'Transaction deleted successfully');
});

exports.receipt = asyncHandler(async (req, res) => {
    const result = await transactionService.uploadReceipt(
        req.user._id,
        req.params.id,
        req.file
    );

    return res.status(200).json({
        success: true,
        message: 'Receipt uploaded',
        ...result,
        data: result,
    });
});

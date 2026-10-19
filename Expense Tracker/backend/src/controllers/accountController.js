const accountService = require('../services/accountService');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
    const accounts = await accountService.listAccounts(req.user._id);

    return res.status(200).json({
        success: true,
        message: 'Accounts fetched',
        data: accounts,
        accounts,
    });
});

exports.create = asyncHandler(async (req, res) => {
    const account = await accountService.createAccount(req.user._id, req.body);
    return sendSuccess(res, 201, account, 'Account created');
});

exports.get = asyncHandler(async (req, res) => {
    const account = await accountService.getAccount(req.user._id, req.params.id);
    return sendSuccess(res, 200, account, 'Account fetched');
});

exports.update = asyncHandler(async (req, res) => {
    const account = await accountService.updateAccount(
        req.user._id,
        req.params.id,
        req.body
    );
    return sendSuccess(res, 200, account, 'Account updated');
});

exports.remove = asyncHandler(async (req, res) => {
    await accountService.deleteAccount(req.user._id, req.params.id);
    return sendSuccess(res, 200, null, 'Account deleted');
});

exports.deposit = asyncHandler(async (req, res) => {
    const account = await accountService.adjust(
        req.user._id,
        req.params.id,
        req.body.amount,
        'deposit'
    );
    return sendSuccess(res, 200, account, 'Deposit recorded');
});

exports.withdraw = asyncHandler(async (req, res) => {
    const account = await accountService.adjust(
        req.user._id,
        req.params.id,
        req.body.amount,
        'withdraw'
    );
    return sendSuccess(res, 200, account, 'Withdrawal recorded');
});

exports.transfer = asyncHandler(async (req, res) => {
    const result = await accountService.transfer(
        req.user._id,
        req.body.fromAccountId,
        req.body.toAccountId,
        req.body.amount
    );
    return sendSuccess(res, 200, result, 'Transfer completed');
});

exports.reconcile = asyncHandler(async (req, res) => {
    const result = await accountService.reconcileAccount(req.user._id, req.params.id);
    return sendSuccess(res, 200, result, 'Account reconciled successfully');
});

exports.reconcileAll = asyncHandler(async (req, res) => {
    const results = await accountService.reconcileAllAccounts(req.user._id);
    return sendSuccess(res, 200, results, 'All accounts reconciled successfully');
});


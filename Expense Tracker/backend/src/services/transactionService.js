const mongoose = require('mongoose');

const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const ApiError = require('../utils/apiError');
const { parseDate } = require('../utils/date');
const { parsePagination, paginationMeta } = require('../utils/pagination');
const { uploadBuffer, deleteUpload } = require('./uploadService');
const { serialize } = require('../utils/serialize');

const ALLOWED_TYPES = ['income', 'expense', 'subscription'];
const BALANCE_SIGN = {
    income: 1,
    expense: -1,
    subscription: -1,
};

function normalizePayload(body, existing = {}) {
    const payload = { ...existing };
    const stringFields = [
        'title',
        'type',
        'category',
        'description',
        'accountName',
        'accountNumber',
        'accountType',
        'reminderNote',
    ];

    stringFields.forEach((field) => {
        if (body[field] !== undefined) payload[field] = body[field];
    });

    if (body.amount !== undefined) payload.amount = Number(body.amount);
    if (body.date !== undefined) payload.date = parseDate(body.date, 'date');

    if (body.reminderDate !== undefined) {
        payload.reminderDate = body.reminderDate
            ? parseDate(body.reminderDate, 'reminderDate')
            : null;
    }

    if (body.hasReminder !== undefined) {
        payload.hasReminder = body.hasReminder === true || body.hasReminder === 'true';
    }

    if (body.skipAccountAdjustment !== undefined) {
        payload.skipAccountAdjustment = body.skipAccountAdjustment === true || body.skipAccountAdjustment === 'true';
    }

    if (payload.hasReminder && !payload.reminderDate) {
        throw new ApiError(400, 'reminderDate is required when hasReminder is true');
    }
    if (!String(payload.title || '').trim()) {
        throw new ApiError(400, 'Transaction title is required');
    }
    if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
        throw new ApiError(400, 'Amount must be greater than zero');
    }
    if (!ALLOWED_TYPES.includes(payload.type)) {
        throw new ApiError(400, 'type must be income, expense or subscription');
    }
    if (!String(payload.category || '').trim()) {
        throw new ApiError(400, 'Category is required');
    }
    if (!payload.date) {
        throw new ApiError(400, 'Transaction date is required');
    }

    payload.title = String(payload.title).trim();
    payload.category = String(payload.category).trim();
    payload.description = String(payload.description || '').trim();

    return payload;
}

function legacyClientId(rawId, accountName) {
    if (rawId) return String(rawId);
    return `frontend-${String(accountName).trim().toLowerCase().replace(/\s+/g, '-')}`;
}

async function resolveAccount(userId, payload) {
    const rawId = payload.accountId || (payload.account ? String(payload.account) : '');
    const accountName = String(payload.accountName || '').trim();

    if (!rawId && !accountName) return null;

    let account = null;

    if (rawId && mongoose.isValidObjectId(rawId)) {
        account = await Account.findOne({ _id: rawId, user: userId });
    }

    if (!account && rawId) {
        account = await Account.findOne({ user: userId, clientId: String(rawId) });
    }

    if (!account && accountName) {
        account = await Account.findOne({ user: userId, name: accountName });
    }

    // Bridge old localStorage account IDs while the frontend is being connected to the API.
    if (!account && accountName) {
        const requestedType = String(payload.accountType || '').toLowerCase();
        const type = ['wallet', 'bank'].includes(requestedType) ? requestedType : 'bank';

        account = await Account.create({
            user: userId,
            clientId: legacyClientId(rawId, accountName),
            name: accountName,
            type,
            accountNumber: payload.accountNumber || '•••• 0000',
            balance: 0,
            institutionId: 'frontend-import',
        });
    }

    if (!account) {
        throw new ApiError(
            400,
            'Selected account was not found. Load or create the account through /api/accounts first.'
        );
    }

    return account;
}

function balanceEffect(transaction) {
    if (!transaction.account) return 0;
    return BALANCE_SIGN[transaction.type] * Number(transaction.amount || 0);
}

async function adjustAccountBalance(userId, accountId, delta) {
    if (!accountId || delta === 0) return;

    const result = await Account.updateOne(
        { _id: accountId, user: userId },
        { $inc: { balance: delta } }
    );

    if (!result.matchedCount) {
        throw new ApiError(404, 'Linked account not found');
    }
}

function addAccountDelta(deltas, accountId, delta) {
    if (!accountId || delta === 0) return;

    const key = String(accountId);
    deltas.set(key, (deltas.get(key) || 0) + delta);
}

async function applyBalanceDeltas(userId, deltas) {
    const applied = [];

    try {
        for (const [accountId, delta] of deltas) {
            if (delta === 0) continue;
            await adjustAccountBalance(userId, accountId, delta);
            applied.push([accountId, delta]);
        }
    } catch (error) {
        await rollbackBalanceDeltas(userId, applied);
        throw error;
    }

    return applied;
}

async function rollbackBalanceDeltas(userId, applied) {
    for (const [accountId, delta] of [...applied].reverse()) {
        try {
            await adjustAccountBalance(userId, accountId, -delta);
        } catch (rollbackError) {
            console.error('Account-balance rollback failed:', rollbackError.message);
        }
    }
}

function buildTransactionFilter(userId, query) {
    const filter = { user: userId };

    if (query.type && query.type !== 'all') {
        const type = String(query.type).toLowerCase();
        if (!ALLOWED_TYPES.includes(type)) {
            throw new ApiError(400, 'Invalid transaction type filter');
        }
        filter.type = type;
    }

    if (query.category && query.category !== 'all') {
        filter.category = String(query.category);
    }

    const startDate = query.startDate || query.dateFrom;
    const endDate = query.endDate || query.dateTo;

    if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = parseDate(startDate, 'startDate');
        if (endDate) {
            filter.date.$lte = parseDate(endDate, 'endDate', { endOfDay: true });
        }

        if (
            filter.date.$gte &&
            filter.date.$lte &&
            filter.date.$gte > filter.date.$lte
        ) {
            throw new ApiError(400, 'startDate must not be after endDate');
        }
    }

    if (query.search) {
        // Escape user input so search terms are treated as plain text, not regex syntax.
        const safeSearch = String(query.search)
            .trim()
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        filter.$or = [
            { title: { $regex: safeSearch, $options: 'i' } },
            { description: { $regex: safeSearch, $options: 'i' } },
            { category: { $regex: safeSearch, $options: 'i' } },
        ];
    }

    return filter;
}

function getSortOptions(sortValue) {
    const allowedSorts = {
        date: { date: 1 },
        '-date': { date: -1 },
        amount: { amount: 1 },
        '-amount': { amount: -1 },
        createdAt: { createdAt: 1 },
        '-createdAt': { createdAt: -1 },
    };

    return allowedSorts[String(sortValue || '-date')] || { date: -1 };
}

async function listTransactions(userId, query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const filter = buildTransactionFilter(userId, query);
    const sort = getSortOptions(query.sort);

    const [transactions, total] = await Promise.all([
        Transaction.find(filter).sort(sort).skip(skip).limit(limit),
        Transaction.countDocuments(filter),
    ]);

    return {
        data: transactions.map(serialize),
        pagination: paginationMeta(page, limit, total),
    };
}

async function listAllTransactions(userId) {
    const transactions = await Transaction.find({ user: userId })
        .sort({ date: -1, createdAt: -1 })
        .limit(5000);

    return transactions.map(serialize);
}

async function getTransaction(userId, transactionId) {
    const transaction = await Transaction.findOne({
        _id: transactionId,
        user: userId,
    });

    if (!transaction) throw new ApiError(404, 'Transaction not found');
    return serialize(transaction);
}

async function createTransaction(userId, body) {
    const payload = normalizePayload(body);
    const account = await resolveAccount(userId, body);
    const transaction = new Transaction({
        user: userId,
        ...payload,
        account: account?._id || null,
        accountId: account ? String(account._id) : '',
        accountName: account?.name || body.accountName || '',
        accountNumber: account?.accountNumber || body.accountNumber || '',
        accountType: account?.type || (
            ['bank', 'wallet', 'other'].includes(body.accountType)
                ? body.accountType
                : 'other'
        ),
    });

    await transaction.validate();
    await transaction.save();

    try {
        if (account && !transaction.skipAccountAdjustment) {
            await adjustAccountBalance(userId, account._id, balanceEffect(transaction));
        }
    } catch (error) {
        await Transaction.deleteOne({ _id: transaction._id });
        throw error;
    }

    return serialize(transaction);
}

async function updateTransaction(userId, transactionId, body) {
    const transaction = await Transaction.findOne({
        _id: transactionId,
        user: userId,
    });

    if (!transaction) throw new ApiError(404, 'Transaction not found');

    const previous = {
        account: transaction.account,
        type: transaction.type,
        amount: transaction.amount,
    };
    const payload = normalizePayload(body, transaction.toObject());
    const accountWasChanged = body.accountId !== undefined || body.accountName !== undefined;
    const nextAccount = accountWasChanged
        ? await resolveAccount(userId, body)
        : transaction.account
            ? await Account.findOne({ _id: transaction.account, user: userId })
            : null;

    if (transaction.account && !nextAccount) {
        throw new ApiError(404, 'Linked account not found');
    }

    Object.assign(transaction, payload);
    transaction.account = nextAccount?._id || null;
    transaction.accountId = nextAccount ? String(nextAccount._id) : '';
    transaction.accountName = nextAccount?.name || body.accountName || '';
    transaction.accountNumber = nextAccount?.accountNumber || body.accountNumber || '';
    transaction.accountType = nextAccount?.type || body.accountType || 'other';

    await transaction.validate();

    const deltas = new Map();
    if (previous.account && !transaction.skipAccountAdjustment) {
        addAccountDelta(
            deltas,
            previous.account,
            -BALANCE_SIGN[previous.type] * Number(previous.amount)
        );
    }
    if (nextAccount && !transaction.skipAccountAdjustment) {
        addAccountDelta(deltas, nextAccount._id, balanceEffect(transaction));
    }

    const applied = await applyBalanceDeltas(userId, deltas);

    try {
        await transaction.save();
    } catch (error) {
        await rollbackBalanceDeltas(userId, applied);
        throw error;
    }

    return serialize(transaction);
}

async function deleteTransaction(userId, transactionId) {
    const transaction = await Transaction.findOne({
        _id: transactionId,
        user: userId,
    });

    if (!transaction) throw new ApiError(404, 'Transaction not found');

    const reversal = (transaction.account && !transaction.skipAccountAdjustment)
        ? -balanceEffect(transaction)
        : 0;
    if (transaction.account && !transaction.skipAccountAdjustment) {
        await adjustAccountBalance(userId, transaction.account, reversal);
    }

    try {
        await transaction.deleteOne();
    } catch (error) {
        if (transaction.account && !transaction.skipAccountAdjustment) {
            await adjustAccountBalance(userId, transaction.account, -reversal);
        }
        throw error;
    }

    if (transaction.receiptPublicId) {
        const resourceType = /\.pdf(?:$|\?)/i.test(transaction.receiptUrl)
            ? 'raw'
            : 'image';
        try {
            await deleteUpload(transaction.receiptPublicId, resourceType);
        } catch (error) {
            console.warn('Receipt delete warning:', error.message);
        }
    }
}

async function uploadReceipt(userId, transactionId, file) {
    if (!file) {
        throw new ApiError(
            400,
            'Choose a receipt file in the multipart field "receipt" or "file"'
        );
    }

    const transaction = await Transaction.findOne({
        _id: transactionId,
        user: userId,
    });
    if (!transaction) throw new ApiError(404, 'Transaction not found');

    const uploaded = await uploadBuffer(file.buffer, {
        folder: 'expense-tracker/receipts',
        resourceType: 'auto',
    });
    const previousPublicId = transaction.receiptPublicId;
    const previousResourceType = /\.pdf(?:$|\?)/i.test(transaction.receiptUrl)
        ? 'raw'
        : 'image';

    transaction.receiptUrl = uploaded.url;
    transaction.receiptPublicId = uploaded.publicId;

    try {
        await transaction.save();
    } catch (error) {
        try {
            await deleteUpload(uploaded.publicId, uploaded.resourceType || 'image');
        } catch (cleanupError) {
            console.warn('New receipt cleanup failed:', cleanupError.message);
        }
        throw error;
    }

    if (previousPublicId) {
        try {
            await deleteUpload(previousPublicId, previousResourceType);
        } catch (error) {
            console.warn('Old receipt cleanup failed:', error.message);
        }
    }

    return {
        receiptUrl: transaction.receiptUrl,
        receiptPublicId: transaction.receiptPublicId,
        transaction: serialize(transaction),
    };
}

module.exports = {
    listTransactions,
    listAllTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    uploadReceipt,
};

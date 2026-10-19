const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { serialize } = require('../utils/serialize');

const STARTER_ACCOUNTS = [
    {
        clientId: 'starter-hbl',
        name: 'HBL Bank',
        institutionId: 'hbl',
        type: 'bank',
        accountNumber: '•••• 4102',
        color: '#1D6F42',
        isDefault: true,
    },
    {
        clientId: 'starter-nayapay',
        name: 'NayaPay',
        institutionId: 'nayapay',
        type: 'wallet',
        accountNumber: '•••• 3140',
        color: '#6D4AFF',
        network: 'VISA',
    },
    {
        clientId: 'starter-cash',
        name: 'Cash Wallet',
        institutionId: 'cash',
        type: 'wallet',
        accountNumber: 'Cash',
        color: '#C06B24',
        network: 'OTHER',
    },
];

async function ensureStarterAccounts(userId) {
    const user = await User.findById(userId);
    if (!user || user.accountsInitialized) return;

    const accountCount = await Account.countDocuments({ user: userId });
    if (accountCount > 0) {
        user.accountsInitialized = true;
        await user.save();
        return;
    }

    try {
        await Account.insertMany(
            STARTER_ACCOUNTS.map((account) => ({
                ...account,
                user: userId,
                initialBalance: 0,
                balance: 0,
            })),
            { ordered: false }
        );
        user.accountsInitialized = true;
        await user.save();
    } catch (error) {
        // A parallel first request may already have inserted the starter accounts.
        if (error.code !== 11000) throw error;
    }
}

async function listAccounts(userId) {
    await ensureStarterAccounts(userId);

    const accounts = await Account.find({ user: userId }).sort({
        isDefault: -1,
        createdAt: 1,
    });

    return accounts.map(serialize);
}

async function createAccount(userId, body) {
    const name = String(body.name || '').trim();
    const type = String(body.type || '').toLowerCase();
    const balance = body.balance === undefined ? 0 : Number(body.balance);
    const initialBalance = body.initialBalance !== undefined
        ? Number(body.initialBalance)
        : balance;

    if (!name) throw new ApiError(400, 'Account name is required');
    if (!['bank', 'wallet'].includes(type)) {
        throw new ApiError(400, 'Account type must be bank or wallet');
    }
    if (!Number.isFinite(balance) || balance < 0) {
        throw new ApiError(400, 'Account balance must be a non-negative number');
    }
    if (!Number.isFinite(initialBalance) || initialBalance < 0) {
        throw new ApiError(400, 'Initial balance must be a non-negative number');
    }

    const account = await Account.create({
        user: userId,
        clientId: body.clientId || null,
        name,
        institutionId: body.institutionId || 'custom',
        type,
        accountNumber: body.accountNumber || '•••• 0000',
        initialBalance,
        balance,
        color: body.color || '#8E3200',
        network: body.network || 'VISA',
        expiry: body.expiry || '12 / 30',
        limit: body.limit == null ? null : Number(body.limit),
    });

    return serialize(account);
}

async function getAccount(userId, accountId) {
    const account = await Account.findOne({ _id: accountId, user: userId });
    if (!account) throw new ApiError(404, 'Account not found');

    const transactions = await Transaction.find({
        user: userId,
        account: account._id,
    })
        .sort({ date: -1 })
        .limit(50);

    return {
        ...serialize(account),
        transactions: transactions.map(serialize),
    };
}

async function updateAccount(userId, accountId, body) {
    const account = await Account.findOne({ _id: accountId, user: userId });
    if (!account) throw new ApiError(404, 'Account not found');

    const editableFields = [
        'name',
        'color',
        'network',
        'expiry',
        'accountNumber',
        'institutionId',
        'limit',
    ];

    editableFields.forEach((field) => {
        if (body[field] !== undefined) account[field] = body[field];
    });

    if (body.initialBalance !== undefined) {
        const nextInitial = Number(body.initialBalance);
        if (!Number.isFinite(nextInitial) || nextInitial < 0) {
            throw new ApiError(400, 'Initial balance must be a non-negative number');
        }
        const delta = nextInitial - (Number(account.initialBalance) || 0);
        account.initialBalance = nextInitial;
        // If caller did not explicitly specify a new balance, offset current balance by initial balance change
        if (body.balance === undefined) {
            account.balance = Math.max(0, (Number(account.balance) || 0) + delta);
        }
    }

    if (body.balance !== undefined) {
        const nextBalance = Number(body.balance);
        if (!Number.isFinite(nextBalance)) {
            throw new ApiError(400, 'Account balance must be a valid number');
        }
        account.balance = nextBalance;
    }

    if (!String(account.name || '').trim()) {
        throw new ApiError(400, 'Account name cannot be empty');
    }

    await account.save();
    return serialize(account);
}

async function reconcileAccount(userId, accountId) {
    const account = await Account.findOne({ _id: accountId, user: userId });
    if (!account) throw new ApiError(404, 'Account not found');

    const transactions = await Transaction.find({
        user: userId,
        account: account._id,
    });

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((tx) => {
        const amt = Number(tx.amount) || 0;
        if (tx.type === 'income') {
            totalIncome += amt;
        } else if (tx.type === 'expense' || tx.type === 'subscription') {
            totalExpense += amt;
        }
    });

    const initBal = Number(account.initialBalance || 0);
    const calculatedBalance = Math.max(0, initBal + totalIncome - totalExpense);
    const previousBalance = Number(account.balance || 0);

    account.balance = calculatedBalance;
    await account.save();

    return {
        ...serialize(account),
        reconciliation: {
            initialBalance: initBal,
            totalIncome,
            totalExpense,
            calculatedBalance,
            previousBalance,
            discrepancy: previousBalance - calculatedBalance,
            transactionCount: transactions.length,
        },
    };
}

async function reconcileAllAccounts(userId) {
    const accounts = await Account.find({ user: userId });
    const results = [];

    for (const acc of accounts) {
        const res = await reconcileAccount(userId, acc._id);
        results.push(res);
    }

    return results;
}

async function deleteAccount(userId, accountId) {
    const account = await Account.findOne({ _id: accountId, user: userId });
    if (!account) throw new ApiError(404, 'Account not found');

    // Unlink the deleted account from any historical transactions while preserving historical records
    await Transaction.updateMany(
        { user: userId, account: accountId },
        { $set: { account: null } }
    );

    await account.deleteOne();
}

async function adjust(userId, accountId, amount, kind) {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new ApiError(400, 'Amount must be greater than zero');
    }
    if (!['deposit', 'withdraw'].includes(kind)) {
        throw new ApiError(400, 'Adjustment type must be deposit or withdraw');
    }

    if (kind === 'deposit') {
        const account = await Account.findOneAndUpdate(
            { _id: accountId, user: userId },
            { $inc: { balance: numericAmount } },
            { new: true, runValidators: true }
        );
        if (!account) throw new ApiError(404, 'Account not found');
        return serialize(account);
    }

    // Use a balance condition so simultaneous withdrawals cannot overdraw the account.
    const account = await Account.findOneAndUpdate(
        {
            _id: accountId,
            user: userId,
            balance: { $gte: numericAmount },
        },
        { $inc: { balance: -numericAmount } },
        { new: true, runValidators: true }
    );

    if (account) return serialize(account);

    const exists = await Account.exists({ _id: accountId, user: userId });
    if (!exists) throw new ApiError(404, 'Account not found');
    throw new ApiError(400, 'Insufficient account balance');
}

async function transfer(userId, fromAccountId, toAccountId, amount) {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new ApiError(400, 'Amount must be greater than zero');
    }
    if (String(fromAccountId) === String(toAccountId)) {
        throw new ApiError(400, 'Source and destination accounts must be different');
    }

    const source = await Account.findOneAndUpdate(
        {
            _id: fromAccountId,
            user: userId,
            balance: { $gte: numericAmount },
        },
        { $inc: { balance: -numericAmount } },
        { new: true, runValidators: true }
    );

    if (!source) {
        const sourceExists = await Account.exists({ _id: fromAccountId, user: userId });
        if (!sourceExists) throw new ApiError(404, 'Source account not found');
        throw new ApiError(400, 'Insufficient account balance');
    }

    try {
        const destination = await Account.findOneAndUpdate(
            { _id: toAccountId, user: userId },
            { $inc: { balance: numericAmount } },
            { new: true, runValidators: true }
        );

        if (!destination) throw new ApiError(404, 'Destination account not found');

        return {
            from: serialize(source),
            to: serialize(destination),
            amount: numericAmount,
        };
    } catch (error) {
        // Compensate for the source debit if the destination update fails.
        await Account.updateOne(
            { _id: fromAccountId, user: userId },
            { $inc: { balance: numericAmount } }
        );
        throw error;
    }
}

module.exports = {
    listAccounts,
    createAccount,
    getAccount,
    updateAccount,
    deleteAccount,
    adjust,
    transfer,
    reconcileAccount,
    reconcileAllAccounts,
};

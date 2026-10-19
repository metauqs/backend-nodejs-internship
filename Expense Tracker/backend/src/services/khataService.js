const KhataEntry = require('../models/KhataEntry');
const Account = require('../models/Account');
const ApiError = require('../utils/apiError');
const { parseDate } = require('../utils/date');
const { serialize } = require('../utils/serialize');
async function ownedAccount(userId, id) {
    if (!id)
        return null;
    const a = await Account.findOne({
        _id: id,
        user: userId
    });
    if (!a)
        throw new ApiError(404, 'Linked account not found');
    return a;
}
async function bump(userId, accountId, delta) {
    if (!accountId || !delta)
        return;
    const res = await Account.updateOne({
        _id: accountId,
        user: userId
    }, {
        $inc: {
            balance: delta
        }
    });
    if (!res.matchedCount)
        throw new ApiError(404, 'Linked account not found');
}
function initialEffect(type, amount) {
    return type === 'lend' ? -Number(amount) : Number(amount);
}
function statusFields(doc) {
    doc.remainingAmount = Math.max(0, Number(doc.totalAmount) - Number(doc.amountPaid));
    doc.status = doc.remainingAmount <= 0 ? 'settled' : doc.amountPaid > 0 ? 'partial' : 'pending';
}
async function list(userId, query) {
    const filter = {
        user: userId
    };
    if (query.type) {
        if (!['lend', 'borrow'].includes(query.type))
            throw new ApiError(400, 'type must be lend or borrow');
        filter.type = query.type;
    }
    if (query.status) {
        if (!['pending', 'partial', 'settled'].includes(query.status))
            throw new ApiError(400, 'Invalid status');
        filter.status = query.status;
    }
    if (query.search)
        filter.$or = [
            {
                partyName: {
                    $regex: escapeRegex(query.search),
                    $options: 'i'
                }
            },
            {
                partyPhone: {
                    $regex: escapeRegex(query.search),
                    $options: 'i'
                }
            },
            {
                notes: {
                    $regex: escapeRegex(query.search),
                    $options: 'i'
                }
            }
        ];
    return (await KhataEntry.find(filter).sort({
        date: -1
    })).map(serialize);
}
function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
async function create(userId, body) {
    const amount = Number(body.totalAmount);
    if (!Number.isFinite(amount) || amount <= 0)
        throw new ApiError(400, 'totalAmount must be greater than zero');
    if (!['lend', 'borrow'].includes(body.type))
        throw new ApiError(400, 'type must be lend or borrow');
    if (!String(body.partyName || '').trim())
        throw new ApiError(400, 'partyName is required');
    const account = body.syncAccount ? await ownedAccount(userId, body.linkedAccountId) : null;
    const doc = await KhataEntry.create({
        user: userId,
        type: body.type,
        partyName: body.partyName,
        partyPhone: body.partyPhone || '',
        relationship: body.relationship || 'Friend',
        totalAmount: amount,
        amountPaid: 0,
        remainingAmount: amount,
        linkedAccount: account ? account._id : null,
        linkedAccountId: account ? String(account._id) : '',
        linkedAccountName: account ? account.name : '',
        syncAccount: Boolean(account),
        date: parseDate(body.date || new Date(), 'date'),
        dueDate: body.dueDate ? parseDate(body.dueDate, 'dueDate') : null,
        notes: body.notes || ''
    });
    try {
        if (account)
            await bump(userId, account._id, initialEffect(doc.type, amount));
    }
    catch (err) {
        await doc.deleteOne();
        throw err;
    }
    return serialize(doc);
}
async function getOne(userId, id) {
    const doc = await KhataEntry.findOne({
        _id: id,
        user: userId
    }).populate('linkedAccount', 'name balance');
    if (!doc)
        throw new ApiError(404, 'Khata entry not found');
    return serialize(doc);
}
async function update(userId, id, body) {
    const doc = await KhataEntry.findOne({
        _id: id,
        user: userId
    });
    if (!doc)
        throw new ApiError(404, 'Khata entry not found');
    const oldTotal = doc.totalAmount, oldAccount = doc.linkedAccount, oldSync = doc.syncAccount, oldType = doc.type;
    for (const key of ['partyName', 'partyPhone', 'relationship', 'notes', 'dueDate', 'date'])
        if (body[key] !== undefined)
            doc[key] = ['date', 'dueDate'].includes(key) ? (body[key] ? parseDate(body[key], key) : null) : body[key];
    if (body.totalAmount !== undefined) {
        const n = Number(body.totalAmount);
        if (!Number.isFinite(n) || n < doc.amountPaid)
            throw new ApiError(400, 'totalAmount cannot be less than amount already paid');
        doc.totalAmount = n;
    }
    await doc.validate();
    const deltas = [];
    if (oldSync && oldAccount)
        deltas.push([oldAccount, -initialEffect(oldType, oldTotal)]);
    if (doc.syncAccount && doc.linkedAccount)
        deltas.push([doc.linkedAccount, initialEffect(doc.type, doc.totalAmount)]);
    const applied = [];
    try {
        for (const [a, d] of deltas) {
            await bump(userId, a, d);
            applied.push([a, d]);
        }
        await doc.save();
    }
    catch (err) {
        for (const [a, d] of applied.reverse()) {
            try {
                await bump(userId, a, -d);
            }
            catch { }
        }
        throw err;
    }
    return serialize(doc);
}
async function payment(userId, id, body) {
    const doc = await KhataEntry.findOne({
        _id: id,
        user: userId
    });
    if (!doc)
        throw new ApiError(404, 'Khata entry not found');
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0)
        throw new ApiError(400, 'Payment amount must be greater than zero');
    if (amount > doc.remainingAmount)
        throw new ApiError(400, 'Payment cannot exceed the remaining amount');
    const sync = body.syncAccount !== false && body.syncAccount !== 'false';
    const account = sync ? await ownedAccount(userId, body.accountId || doc.linkedAccount) : null;
    const date = parseDate(body.date || new Date(), 'date');
    const delta = doc.type === 'lend' ? amount : -amount;
    if (account)
        await bump(userId, account._id, delta);
    doc.amountPaid += amount;
    doc.history.push({
        amount,
        date,
        account: account ? account._id : null,
        accountName: account ? account.name : '',
        note: body.note || 'Installment received',
        syncAccount: Boolean(account)
    });
    statusFields(doc);
    try {
        await doc.save();
    }
    catch (err) {
        if (account) {
            try {
                await bump(userId, account._id, -delta);
            }
            catch { }
        }
        throw err;
    }
    return serialize(doc);
}
async function summary(userId) {
    const rows = await KhataEntry.aggregate([
        {
            $match: {
                user: new (require('mongoose').Types.ObjectId)(userId),
                status: {
                    $ne: 'settled'
                }
            }
        },
        {
            $group: {
                _id: '$type',
                amount: {
                    $sum: '$remainingAmount'
                },
                entries: {
                    $sum: 1
                }
            }
        }
    ]);
    const lend = rows.find((row) => row._id === 'lend')?.amount || 0;
    const borrow = rows.find((row) => row._id === 'borrow')?.amount || 0;
    return {
        maineLeneHain: lend,
        maineDeneHain: borrow,
        lendTotal: lend,
        borrowTotal: borrow,
        net: lend - borrow,
        pendingEntries: rows.reduce((a, x) => a + x.entries, 0)
    };
}
async function remove(userId, id) {
    const doc = await KhataEntry.findOne({
        _id: id,
        user: userId
    });
    if (!doc)
        throw new ApiError(404, 'Khata entry not found');
    const reversal = [];
    if (doc.syncAccount && doc.linkedAccount)
        reversal.push([doc.linkedAccount, -initialEffect(doc.type, doc.totalAmount)]);
    for (const h of doc.history)
        if (h.syncAccount && h.account)
            reversal.push([h.account, -(doc.type === 'lend' ? Number(h.amount) : -Number(h.amount))]);
    const applied = [];
    try {
        for (const [a, d] of reversal) {
            await bump(userId, a, d);
            applied.push([a, d]);
        }
        await doc.deleteOne();
    }
    catch (err) {
        for (const [a, d] of applied.reverse()) {
            try {
                await bump(userId, a, -d);
            }
            catch { }
        }
        throw err;
    }
}
module.exports = {
    list,
    create,
    getOne,
    update,
    payment,
    summary,
    remove
};

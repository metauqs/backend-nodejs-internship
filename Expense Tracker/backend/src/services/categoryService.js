const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/apiError');
const { serialize } = require('../utils/serialize');
const defaults = [
    ['Salary', 'income', 'Wallet'],
    ['Business', 'income', 'BriefcaseBusiness'],
    ['Investment', 'income', 'ChartNoAxesCombined'],
    ['Gift', 'income', 'Gift'],
    ['Other Income', 'income', 'CirclePlus'],
    ['Food', 'expense', 'Utensils'],
    ['Groceries', 'expense', 'ShoppingBasket'],
    ['Housing', 'expense', 'House'],
    ['Home', 'expense', 'House'],
    ['Telephone', 'expense', 'Smartphone'],
    ['Bills', 'expense', 'Receipt'],
    ['Electricity', 'expense', 'Zap'],
    ['Internet', 'expense', 'Wifi'],
    ['Repair', 'expense', 'Wrench'],
    ['Car', 'expense', 'Car'],
    ['Fuel', 'expense', 'Fuel'],
    ['Transportation', 'expense', 'Bus'],
    ['Travel', 'expense', 'Plane'],
    ['Shopping', 'expense', 'ShoppingCart'],
    ['Clothing', 'expense', 'Shirt'],
    ['Sport', 'expense', 'Activity'],
    ['Entertainment', 'expense', 'Clapperboard'],
    ['Beauty', 'expense', 'Sparkles'],
    ['Health', 'expense', 'HeartPulse'],
    ['Snacks', 'expense', 'Cookie'],
    ['Education', 'expense', 'BookOpen'],
    ['Pet', 'expense', 'PawPrint'],
    ['Other Expense', 'expense', 'Circle'],
    ['Subscriptions', 'subscription', 'Repeat'],
];
async function ensureDefaults(userId) {
    const existing = await Category.find({
        user: userId
    }).select('name type').lean();
    const keys = new Set(existing.map(x => `${x.type}:${x.name.toLowerCase()}`));
    const missing = defaults.filter(([name, type]) => !keys.has(`${type}:${name.toLowerCase()}`));
    if (missing.length)
        await Category.insertMany(missing.map(([name, type, icon]) => ({
            user: userId,
            name,
            type,
            icon,
            isSystem: true,
            color: '#8E3200'
        })), {
            ordered: false
        });
}
async function list(userId, type) {
    await ensureDefaults(userId);
    const filter = {
        user: userId
    };
    if (type) {
        const t = String(type).toLowerCase();
        if (!['income', 'expense', 'subscription'].includes(t))
            throw new ApiError(400, 'Invalid category type');
        filter.type = t;
    }
    return (await Category.find(filter).sort({
        isSystem: -1,
        name: 1
    })).map(serialize);
}
async function create(userId, body) {
    const name = String(body.name || '').trim(), type = String(body.type || '').toLowerCase();
    if (!name)
        throw new ApiError(400, 'Category name is required');
    if (!['income', 'expense', 'subscription'].includes(type))
        throw new ApiError(400, 'Invalid category type');
    return serialize(await Category.create({
        user: userId,
        name,
        type,
        color: body.color || '#8E3200',
        icon: body.icon || 'Circle',
        isSystem: false
    }));
}
async function update(userId, id, body) {
    const doc = await Category.findOne({
        _id: id,
        user: userId
    });
    if (!doc)
        throw new ApiError(404, 'Category not found');
    if (doc.isSystem)
        throw new ApiError(400, 'Built-in categories cannot be edited');
    if (body.name !== undefined)
        doc.name = String(body.name).trim();
    if (body.type !== undefined) {
        const t = String(body.type).toLowerCase();
        if (!['income', 'expense', 'subscription'].includes(t))
            throw new ApiError(400, 'Invalid category type');
        doc.type = t;
    }
    if (body.color !== undefined)
        doc.color = body.color;
    if (body.icon !== undefined)
        doc.icon = body.icon;
    return serialize(await doc.save());
}
async function remove(userId, id) {
    const doc = await Category.findOne({
        _id: id,
        user: userId
    });
    if (!doc)
        throw new ApiError(404, 'Category not found');
    if (doc.isSystem)
        throw new ApiError(400, 'Built-in categories cannot be deleted');
    const count = await Transaction.countDocuments({
        user: userId,
        category: doc.name
    });
    if (count)
        throw new ApiError(409, 'This category is used by existing transactions');
    await doc.deleteOne();
}
module.exports = {
    list,
    create,
    update,
    remove
};

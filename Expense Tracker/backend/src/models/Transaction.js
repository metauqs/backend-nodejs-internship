const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    type: {
        type: String,
        enum: ['income', 'expense', 'subscription'],
        required: true,
        default: 'expense',
        index: true
    },
    category: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        default: null
    },
    accountId: {
        type: String,
        default: ''
    },
    accountName: {
        type: String,
        default: ''
    },
    accountNumber: {
        type: String,
        default: ''
    },
    accountType: {
        type: String,
        enum: ['bank', 'wallet', 'other'],
        default: 'bank'
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    receiptUrl: {
        type: String,
        default: ''
    },
    receiptPublicId: {
        type: String,
        default: ''
    },
    hasReminder: {
        type: Boolean,
        default: false
    },
    reminderDate: {
        type: Date,
        default: null
    },
    reminderNote: {
        type: String,
        default: ''
    },
    skipAccountAdjustment: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});
schema.virtual('id').get(function () {
    return this._id.toHexString();
});
schema.index({
    user: 1,
    date: -1
});
schema.index({
    user: 1,
    type: 1,
    date: -1
});
schema.index({
    user: 1,
    category: 1
});
module.exports = mongoose.model('Transaction', schema);

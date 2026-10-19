const mongoose = require('mongoose');
const historySchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    date: {
        type: Date,
        default: Date.now
    },
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        default: null
    },
    accountName: {
        type: String,
        default: ''
    },
    note: {
        type: String,
        default: 'Installment received'
    },
    syncAccount: {
        type: Boolean,
        default: false
    },
}, {
    _id: true
});
const schema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['lend', 'borrow'],
        required: true
    },
    partyName: {
        type: String,
        required: true,
        trim: true
    },
    partyPhone: {
        type: String,
        trim: true,
        default: ''
    },
    relationship: {
        type: String,
        enum: ['Friend', 'Relative', 'Family', 'Colleague', 'Client', 'Other'],
        default: 'Friend'
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 1
    },
    amountPaid: {
        type: Number,
        default: 0,
        min: 0
    },
    remainingAmount: {
        type: Number,
        default: 0
    },
    linkedAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        default: null
    },
    linkedAccountId: {
        type: String,
        default: ''
    },
    linkedAccountName: {
        type: String,
        default: ''
    },
    syncAccount: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'partial', 'settled'],
        default: 'pending',
        index: true
    },
    history: [historySchema],
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
schema.pre('validate', function () {
    this.remainingAmount = Math.max(0, Number(this.totalAmount || 0) - Number(this.amountPaid || 0));
    this.status = this.remainingAmount <= 0 ? 'settled' : this.amountPaid > 0 ? 'partial' : 'pending';
});
module.exports = mongoose.model('KhataEntry', schema);

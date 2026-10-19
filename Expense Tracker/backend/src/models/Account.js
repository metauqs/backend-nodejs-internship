const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    clientId: {
        type: String,
        default: null
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    institutionId: {
        type: String,
        default: 'custom'
    },
    type: {
        type: String,
        enum: ['bank', 'wallet'],
        required: true
    },
    accountNumber: {
        type: String,
        default: '•••• 0000'
    },
    initialBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    balance: {
        type: Number,
        default: 0,
        required: true
    },
    color: {
        type: String,
        default: '#8E3200'
    },
    network: {
        type: String,
        default: 'VISA'
    },
    expiry: {
        type: String,
        default: '12 / 30'
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    limit: {
        type: Number,
        default: null
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
    clientId: 1
}, {
    unique: true,
    partialFilterExpression: {
        clientId: {
            $type: 'string'
        }
    }
});
module.exports = mongoose.model('Account', schema);

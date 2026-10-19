const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80
    },
    type: {
        type: String,
        enum: ['income', 'expense', 'subscription'],
        required: true,
        lowercase: true
    },
    color: {
        type: String,
        default: '#8E3200'
    },
    icon: {
        type: String,
        default: 'Circle'
    },
    isSystem: {
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
    type: 1,
    name: 1
}, {
    unique: true
});
module.exports = mongoose.model('Category', schema);

const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    monthKey: {
        type: String,
        required: true,
        match: /^\d{4}-(0[1-9]|1[0-2])$/
    },
    amount: {
        type: Number,
        required: true,
        min: 0
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
    monthKey: 1
}, {
    unique: true
});
module.exports = mongoose.model('Budget', schema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const currencies = ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'CAD', 'INR'];
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 20
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false
    },
    currency: {
        type: String,
        enum: currencies,
        default: 'PKR'
    },
    displayName: {
        type: String,
        trim: true,
        default: ''
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    title: {
        type: String,
        trim: true,
        default: ''
    },
    company: {
        type: String,
        trim: true,
        default: ''
    },
    location: {
        type: String,
        trim: true,
        default: ''
    },
    bio: {
        type: String,
        trim: true,
        default: ''
    },
    avatarUrl: {
        type: String,
        default: ''
    },
    avatarPublicId: {
        type: String,
        default: ''
    },
    avatarPreset: {
        type: String,
        enum: ['rust', 'ochre', 'emerald', 'sapphire', 'onyx', 'amethyst'],
        default: 'onyx'
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    notifications: {
        budgetAlerts: {
            type: Boolean,
            default: true
        },
        dailyDigest: {
            type: Boolean,
            default: true
        },
        weeklyReport: {
            type: Boolean,
            default: true
        },
        largeTxAlerts: {
            type: Boolean,
            default: true
        },
        billReminders: {
            type: Boolean,
            default: true
        },
        monthlyPdf: {
            type: Boolean,
            default: true
        },
    },
    accountsInitialized: {
        type: Boolean,
        default: false
    },
    monthlyBudget: {
        type: Number,
        default: 0,
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
userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
userSchema.pre('save', async function () {
    if (this.isModified('password'))
        this.password = await bcrypt.hash(this.password, 12);
});
userSchema.methods.comparePassword = function (candidate) {
    return bcrypt.compare(candidate, this.password);
};
module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');
const DiscountSchema = new mongoose.Schema({
    invoisediscountPrice: {
        type: Number,
        required: true
    },
    discountype: { type: String },
    amount: { type: Number, default: 0 },
    onlineSync: {
        isOnlineSync: {
            type: Boolean,
            default: false,
        },
        OnlineSyncDate: {
            type: Date,
        },
    },
    computerId: { type: String }, // Link to the computer

    active: { type: Boolean, default: true }
}

    , {
        timestamps: true
    });
const Discount = mongoose.model('Discount', DiscountSchema);

module.exports = Discount;

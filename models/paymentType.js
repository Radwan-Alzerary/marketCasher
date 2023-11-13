const mongoose = require('mongoose');
const paymentTypeSchema = new mongoose.Schema({
    name: {
        type: String,
    },

}, {
    timestamps: true
});
const paymentType = mongoose.model('paymentType', paymentTypeSchema);

module.exports = paymentType;

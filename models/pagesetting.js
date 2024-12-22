const mongoose = require('mongoose');
const SettingSchema = new mongoose.Schema({
    shopname: {
        type: String,
        default: ""
    },

    shoplogo: {
        type: String,
        default: ""

    },

    printerActive: {
        type: Boolean,
        default: true
    },

    printerip: {
        type: String,
        default: ""
    },

    adress: {
        type: String,
        default: ""
    },

    phonnumber: {
        type: String,
        default: 0
    },
    dollarprice: {
        type: Number,
        default: "1"
    },
    printerType: {
        type: String,
        default: "Thermal"
    },
    amountUnit: {
        type: String,
        default: ""
    },
    closedTimeOffset: {
        type: Number,
        default: 0
    },
    useInvoiceNumber: {
        type: Boolean,
        default: true
    },
    mainCurrency: {
        type: String,
        default: "iqd"
    },
    onlineSync: {
        isOnlineSync: {
            type: Boolean,
            default: false,
        },
        OnlineSyncDate: {
            type: Date,
        },
    },

    buyCurrency: {
        type: String,
        default: "iqd"
    },
    sellCurrency: {
        type: String,
        default: "iqd"
    },
    ExchangeRate: {
        type: Number
    },
    computerId: { type: String }, // Link to the computer

    barcodeXsize: { type: Number, default: 0 },
    barcodeYsize: { type: Number, default: 0 },

    systemdiscount: {
        active: { type: Boolean, default: true },
        discountype: { type: String },
        amount: { type: Number, default: 0 }
    },
    deleverytable: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
    invoicefooter: { type: String }
}, {
    timestamps: true
});
const Setting = mongoose.model('Setting', SettingSchema);

module.exports = Setting;

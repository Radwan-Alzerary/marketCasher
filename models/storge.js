const mongoose = require('mongoose');
const storgeSchema = new mongoose.Schema({
    name: {
        type: String,
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
    computerId: { type: String }, // Link to the computer

    
}, {
    timestamps: true
});
const storge = mongoose.model('storge', storgeSchema);

module.exports = storge;

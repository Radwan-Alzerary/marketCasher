// models/Counter.js

const mongoose = require("mongoose");

const CounterSchema = new mongoose.Schema({
  date: { type: String, required: true }, // Store date as 'YYYY-MM-DD'
  count: { type: Number, default: 1 },
  onlineSync: {
    isOnlineSync: {
        type: Boolean,
        default: false,
    },
    OnlineSyncDate: {
        type: Date,
    },
},
computerId: { type: String}, // Link to the computer

}, { timestamps: true });

const Counter = mongoose.model("Counter", CounterSchema);

module.exports = Counter;

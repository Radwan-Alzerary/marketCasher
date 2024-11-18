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

});

const Counter = mongoose.model("Counter", CounterSchema);

module.exports = Counter;

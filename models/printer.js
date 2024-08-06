const mongoose = require("mongoose");
const TableSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    type: {
      type: Boolean,
    },
    ip: {
      type: String,
    },
    numberOfPrint: { type: Number },
  },
  {
    timestamps: true,
  }
);
const Table = mongoose.model("Table", TableSchema);

module.exports = Table;

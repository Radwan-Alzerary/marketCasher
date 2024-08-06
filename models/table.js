const mongoose = require("mongoose");
const TableSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    book: {
      state: { type: Boolean, default: false },
      startBookedDate: { type: Date },
      bookedEndDate: { type: Date },
    },
    invoice: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice",
      },
    ],
    lastinvoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
  },
  {
    timestamps: true,
  }
);
const Table = mongoose.model("Table", TableSchema);

module.exports = Table;

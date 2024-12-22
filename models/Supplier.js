const mongoose = require("mongoose");
const SupplierSchema = new mongoose.Schema(
  {
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

    purchasesInvoice: [
      {
        invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
      },
    ],
  },
  {
    timestamps: true,
  }
);
const Supplier = mongoose.model("Supplier", SupplierSchema);

module.exports = Supplier;

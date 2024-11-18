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

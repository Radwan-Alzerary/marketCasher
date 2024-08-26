const mongoose = require("mongoose");
const SupplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
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

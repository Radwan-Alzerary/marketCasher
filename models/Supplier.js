const mongoose = require("mongoose");
const SupplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    purchasesInvoice: [
      {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
        quantity: { type: Number },
        discount: { type: Number },
        discountType: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);
const Supplier = mongoose.model("Supplier", SupplierSchema);

module.exports = Supplier;

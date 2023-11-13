const mongoose = require("mongoose");
const purchasesInvoiceSchema = new mongoose.Schema(
  {
    serialNumber: { type: String },
    Supplier: { type: String },
    invoiceDate: { type: Date },
    PaymentType: { type: mongoose.Schema.Types.ObjectId, ref: "paymentType" },
    storge: { type: mongoose.Schema.Types.ObjectId, ref: "storge" },
    fullCost:{type:Number,default:0},
    fullquantity:{type:Number,default:0},
    fulldiscount:{type:Number,default:0},
    fullgift:{type:Number,default:0},
    fullreturn:{type:Number,default:0},
    items: [
      {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
        quantity: { type: Number, default: 1 },
        cost: { type: Number },
        discount: { type: Number, default: 0 },
        gift: { type: Number, default: 0 },
        return: { type: Number, default: 0 },
      },
    ],
    active: { type: Boolean, default: true },
    state: { type: String },
  },
  {
    timestamps: true,
  }
);
const purchasesInvoice = mongoose.model(
  "purchasesInvoice",
  purchasesInvoiceSchema
);

module.exports = purchasesInvoice;

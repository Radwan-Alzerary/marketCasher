const mongoose = require("mongoose");
const CustomerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
    },
    addresses: { type: String },
    onlineSync: {
      isOnlineSync: {
          type: Boolean,
          default: false,
      },
      OnlineSyncDate: {
          type: Date,
      },
  },

    invoice: [
      {
        invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
      },
    ],
  },
  {
    timestamps: true,
  }
);
const Customer = mongoose.model("Customer", CustomerSchema);

module.exports = Customer;

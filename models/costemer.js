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
    phoneNumber2: {
      type: String,
    },
    guarantor: { type: String },

    addresses: { type: String },

    nearestAddresses: { type: String },
    jop: { type: String },
    specialDiscount: { type: Number },
    nearestGuarantorAddresses: { type: String },
    onlineSync: {
      isOnlineSync: {
        type: Boolean,
        default: false,
      },

      OnlineSyncDate: {
        type: Date,
      },
      jop: { type: String }
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

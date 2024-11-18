const mongoose = require("mongoose");
const paymentTypeSchema = new mongoose.Schema(
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

  },
  {
    timestamps: true,
  }
);
const paymentType = mongoose.model("paymentType", paymentTypeSchema);

module.exports = paymentType;

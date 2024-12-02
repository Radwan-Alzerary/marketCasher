// Installment.js
const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    paymentType: { type: String },
    date: { type: Date },
    amount: { type: Number },
    isPaid: { type: Boolean, default: false },
  },
  { _id: false }
);

const PaymentTransferSchema = new mongoose.Schema(
  {
    dateOfPayment: { type: Date },
    amount: { type: Number },
  },
  { _id: false }
);

const InstallmentSchema = new mongoose.Schema(
  {
    notificationDays: { type: Number },
    maintenanceType: {
      type: String,
      enum: ["يومي", "أسبوعي", "شهري", "مخصص"],
    },
    totalAmount: { type: Number }, // Total amount to be paid in installments
    installmentsCount: { type: Number }, // Number of installments
    firstPaymentDate: { type: Date }, // Start date for the first installment
    paymentInterval: {
      type: String,
      enum: ["daily", "weekly", "monthly", "custom"],
    }, // Payment interval
    remainingAmount: { type: Number }, // Remaining amount to be paid
    payments: [PaymentSchema],
    paymentsTransfer: [PaymentTransferSchema],
  },
  {
    timestamps: true,
  }
);

const Installment = mongoose.model("Installment", InstallmentSchema);

module.exports = Installment;

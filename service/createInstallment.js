// createInstallment.js

const Installment = require("../models/InstallmentSchema"); // Import the Installment model

// Helper function to create installment data
async function createInstallmentData(reqBody) {
  const {
    installmentType,
    installmentsCount,
    initialPayment,
    initialStartDate,
    notificationDays,
    remainingAfterInitial,
  } = reqBody;

  // Parse numerical values and dates
  const parsedInitialPayment = parseFloat(initialPayment) || 0;
  const parsedRemainingAmount = parseFloat(remainingAfterInitial) || 0;
  const parsedFirstPaymentDate = new Date(initialStartDate);

  // Initialize payments array with the initial payment if any
  const payments = [];
  const paymentsTransfer = [];

  if (parsedInitialPayment > 0) {
    payments.push({
      paymentType: 'initial',
      date: parsedFirstPaymentDate,
      amount: parsedInitialPayment,
      isPaid: true, // Mark initial payment as paid
    });

    paymentsTransfer.push({
      dateOfPayment: parsedFirstPaymentDate,
      amount: parsedInitialPayment,
    });
  }

  // Helper function to add the correct interval to a date
  function addInterval(date, intervalType, intervalCount) {
    const newDate = new Date(date);
    switch (intervalType) {
      case 'daily':
        newDate.setDate(newDate.getDate() + intervalCount);
        break;
      case 'weekly':
        newDate.setDate(newDate.getDate() + 7 * intervalCount);
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + intervalCount);
        break;
      default:
        throw new Error('Unsupported installment type');
    }
    return newDate;
  }

  // Calculate remaining installment dates and amounts
  const installmentAmount = parsedRemainingAmount / installmentsCount || 0;
  for (let i = 1; i <= installmentsCount; i++) {
    payments.push({
      paymentType: 'installment',
      date: addInterval(parsedFirstPaymentDate, installmentType, i),
      amount: parseFloat(installmentAmount.toFixed(2)), // Rounded to 2 decimal places
      isPaid: false,
    });
  }

  // Build the installment object
  const installmentData = {
    notificationDays,
    maintenanceType:
      installmentType === 'custom'
        ? 'مخصص'
        : installmentType === 'daily'
        ? 'يومي'
        : installmentType === 'weekly'
        ? 'أسبوعي'
        : 'شهري',
    totalAmount: parsedInitialPayment + parsedRemainingAmount,
    installmentsCount,
    firstPaymentDate: parsedFirstPaymentDate,
    paymentInterval: installmentType,
    remainingAmount: parsedRemainingAmount,
    payments,
    paymentsTransfer, // Track initial payment if applicable
  };

  // Create and save the Installment document
  const installment = new Installment(installmentData);
  await installment.save();

  return installment._id; // Return the Installment ID to associate with the Invoice
}

// Helper function to handle payments
async function processPayment(installmentId, paymentAmount) {
  // Fetch the Installment document
  const installment = await Installment.findById(installmentId);
  if (!installment) {
    throw new Error('Installment not found');
  }

  let remainingPayment = parseFloat(paymentAmount);
  const unpaidPayments = installment.payments.filter((payment) => !payment.isPaid);
  const totalRemainingInstallments = unpaidPayments.length;

  // Track payment transfer
  installment.paymentsTransfer.push({
    dateOfPayment: new Date(),
    amount: paymentAmount,
  });

  // Process the payment
  for (let payment of installment.payments) {
    if (!payment.isPaid) {
      if (remainingPayment >= payment.amount) {
        remainingPayment -= payment.amount;
        payment.isPaid = true;
      } else {
        payment.amount -= remainingPayment;
        remainingPayment = 0;
        break;
      }
    }
  }

  // Recalculate the remaining amount
  installment.remainingAmount = installment.payments
    .filter((payment) => !payment.isPaid)
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Redistribute amounts for unpaid installments if necessary
  if (remainingPayment === 0) {
    const remainingInstallments = installment.payments.filter((payment) => !payment.isPaid);
    const newInstallmentAmount =
      installment.remainingAmount / remainingInstallments.length || 0;

    remainingInstallments.forEach((payment) => {
      payment.amount = parseFloat(newInstallmentAmount.toFixed(2));
    });
  }

  // Save the updated Installment
  await installment.save();

  return installment;
}

module.exports = { createInstallmentData, processPayment };

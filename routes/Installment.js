const express = require('express');
const router = express.Router();
const SystemSetting = require("../models/systemSetting");
const User = require("../models/user");
const Customer = require("../models/costemer");
const { processPayment } = require("../service/createInstallment");
const Invoice = require("../models/invoice");
const Installment = require("../models/InstallmentSchema"); // Import the Installment model
const paymentType = require('../models/paymentType');

// Routes

// 1. Fetch clients with installment details
router.get('/', async (req, res) => {
    try {
        // Fetch customers with populated invoice and installment data
        const customers = await Customer.find()
            .populate({
                path: 'invoice.invoiceId',
                model: 'Invoice',
                populate: {
                    path: 'installmentInvoice',
                    model: 'Installment',
                },
            })
            .lean();

        const user = await User.findById(req.user).lean();
        const systemSetting = await SystemSetting.findOne().lean();

        // Extract notificationDays from system settings
        const notificationDays = systemSetting?.notificationDays || 0;
        const installmentPayment = await paymentType.findOne({name:"قسط"})
        // Transform customers to clients with necessary installment details
        const clients = customers.map((customer) => {
            console.log(customer.invoice)
            const invoices = customer.invoice
                .map((inv) => inv.invoiceId)
                .filter((inv) => inv); // Ensure invoice exists

            // Calculate total due amount
            const totalDue = invoices.reduce((sum, inv) => {
                const installment = inv.installmentInvoice;
                if (installment) {
                    const paymentsTransfer = installment.paymentsTransfer || [];
                    const paidAmount = paymentsTransfer.reduce(
                        (paidSum, payment) => paidSum + (payment.amount || 0),
                        0
                    );
                    const amountDue = installment.totalAmount - paidAmount;
                    return sum + amountDue;
                } else {
                    return sum;
                }
            }, 0);

            // Find the next unpaid scheduled payment date
            const unpaidPayments = invoices
                .flatMap((inv) => inv.installmentInvoice?.payments || [])
                .filter((payment) => !payment.isPaid);

            // Determine the earliest unpaid payment date
            const nextPaymentDate = unpaidPayments.length > 0
                ? new Date(Math.min(...unpaidPayments.map(p => new Date(p.date))))
                : null;

            // Calculate the due date by adding notificationDays
            let dueDate = null;
            if (nextPaymentDate) {
                dueDate = new Date(nextPaymentDate);
                dueDate.setDate(dueDate.getDate() + notificationDays);
            }

            // Determine the client's status
            const now = new Date();
            let status = ''; // Initialize status

            if (totalDue === 0) {
                status = 'completed';
            } else if (dueDate && now > dueDate) {
                status = 'late';
            } else {
                status = 'upcoming';
            }

            // Get the last payment date
            const lastPayment = invoices
                .flatMap((inv) => inv.installmentInvoice?.paymentsTransfer || [])
                .filter((payment) => payment.dateOfPayment)
                .sort((a, b) => new Date(b.dateOfPayment) - new Date(a.dateOfPayment))[0]?.dateOfPayment || 'غير متوفر';

            return {
                id: customer._id,
                name: customer.name || 'غير معروف',
                phone: customer.phoneNumber || 'غير متوفر',
                lastPaymentDate: lastPayment,
                totalDue: totalDue,
                receiptCount: invoices
                    .flatMap((inv) => inv.installmentInvoice?.paymentsTransfer || [])
                    .filter((payment) => payment.dateOfPayment).length,
                status: status,
            };
        });

        const isCardView = req.query.view === 'card';

        res.render('Installment/index', {
            clients,
            role: user.role,
            systemSetting,
            isCardView,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});
// Installment/payment route
router.post('/payment', async (req, res) => {
    try {
        const { installmentId, paymentAmount, paymentIndex } = req.body;

        // Fetch the Installment document
        const installment = await Installment.findById(installmentId);
        if (!installment) {
            return res.status(404).json({ success: false, message: 'Installment not found' });
        }

        // Validate paymentIndex
        if (paymentIndex === undefined || paymentIndex < 0 || paymentIndex >= installment.payments.length) {
            return res.status(400).json({ success: false, message: 'Invalid payment index' });
        }

        const payment = installment.payments[paymentIndex];

        // Check if payment is already paid
        if (payment.isPaid) {
            return res.status(400).json({ success: false, message: 'Payment is already made' });
        }

        // Update the payment
        payment.isPaid = true;

        // Update paymentsTransfer
        installment.paymentsTransfer.push({
            paymentType: payment.paymentType,
            dateOfPayment: new Date(),
            amount: paymentAmount,
        });

        // Recalculate remaining amount
        installment.remainingAmount -= paymentAmount;

        await installment.save();

        res.status(200).json({ success: true, data: installment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An error occurred' });
    }
});
// New route for direct payment
router.post('/payment/direct', async (req, res) => {
    try {
        const { installmentId, paymentAmount } = req.body;

        // Validate input data
        if (!installmentId || !paymentAmount) {
            return res.status(400).json({ success: false, message: 'Installment ID and payment amount are required' });
        }

        // Fetch the Installment document
        const installment = await Installment.findById(installmentId);
        if (!installment) {
            return res.status(404).json({ success: false, message: 'Installment not found' });
        }

        let remainingPayment = parseFloat(paymentAmount);
        if (isNaN(remainingPayment) || remainingPayment <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid payment amount' });
        }

        // Track the initial remaining amount for paymentsTransfer record
        const initialPaymentAmount = remainingPayment;

        // Process the payment against unpaid installments
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

        // Update paymentsTransfer
        installment.paymentsTransfer.push({
            paymentType: 'direct',
            dateOfPayment: new Date(),
            amount: initialPaymentAmount,
        });

        // Recalculate remaining amount
        installment.remainingAmount = installment.payments
            .filter((payment) => !payment.isPaid)
            .reduce((sum, payment) => sum + payment.amount, 0);

        // Save the updated Installment
        await installment.save();

        res.status(200).json({ success: true, data: installment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An error occurred' });
    }
});
// 3. Fetch client details along with their invoices and installments
router.get('/client/:id', async (req, res) => {
    try {
        const clientId = req.params.id;
        const user = await User.findById(req.user).lean();
        const systemSetting = await SystemSetting.findOne().lean();
        // Fetch client data and populate invoices and installments
        const clientData = await Customer.findById(clientId)
            .populate({
                path: 'invoice.invoiceId',
                model: 'Invoice',
                populate: {
                    path: 'installmentInvoice',
                    model: 'Installment',
                },
            })
            .lean();

        if (!clientData) {
            return res.status(404).send('Client not found');
        }

        // Process client data to extract installment and status
        const invoices = clientData.invoice
            .map((inv) => inv.invoiceId)
            .filter((inv) => inv); // Ensure invoice exists

        clientData.totalDue = invoices.reduce(
            (sum, inv) => sum + (inv.installmentInvoice?.remainingAmount || 0),
            0
        );

        clientData.lastPaymentDate =
            invoices
                .flatMap((inv) => inv.installmentInvoice?.payments || [])
                .filter((payment) => payment.isPaid)
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.date || 'غير متوفر';

        clientData.receiptCount = invoices
            .flatMap((inv) => inv.installmentInvoice?.payments || [])
            .filter((payment) => payment.isPaid).length;

        clientData.status = clientData.totalDue > 0 ? 'late' : 'paid';
        console.log(clientData)

        res.render('Installment/client', {
            clientData,
            role: user.role,
            systemSetting,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});
// 4. Fetch invoice details along with its installment
router.get('/invoice/:id', async (req, res) => {
    try {
        const invoiceId = req.params.id;

        // Find the invoice by ID and populate the installment
        const invoice = await Invoice.findById(invoiceId)
            .populate('installmentInvoice')
            .lean();

        if (!invoice) {
            return res.status(404).send('Invoice not found');
        }

        // Find the associated client (customer)
        const client = await Customer.findOne({ 'invoice.invoiceId': invoiceId }).lean();
        if (!client) {
            return res
                .status(404)
                .send('Client associated with this invoice not found');
        }
        const user = await User.findById(req.user).lean();
        const systemSetting = await SystemSetting.findOne().lean();

        // Add computed fields if necessary (e.g., status, remaining balance)
        invoice.remaining = invoice.installmentInvoice?.remainingAmount || 0;
        invoice.status = invoice.remaining > 0 ? 'late' : 'paid';
        invoice.date = invoice.createdAt.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
        // Render the invoice details page
        res.render('Installment/invoiceDeatails', {
            role: user.role,
            systemSetting,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});
// API endpoint to get invoice data
router.get('/info/:id', async (req, res) => {
    try {
        const invoiceId = req.params.id;

        // Find the invoice by ID and populate the installment
        const invoice = await Invoice.findById(invoiceId)
            .populate('installmentInvoice')
            .populate('food.id')
            .lean();

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Find the associated client (customer)
        const client = await Customer.findOne({ 'invoice.invoiceId': invoiceId }).lean();

        res.json({ invoice, client });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;

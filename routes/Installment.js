const express = require('express');
const router = express.Router();
const SystemSetting = require("../models/systemSetting");
const User = require("../models/user");
const Customer = require("../models/costemer");
const { processPayment } = require("../service/createInstallment");
const Invoice = require("../models/invoice");
const Installment = require("../models/InstallmentSchema"); // Import the Installment model

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
        // Transform customers to clients with necessary installment details
        // Transform customers to clients with necessary installment details
        const clients = customers.map((customer) => {
            const invoices = customer.invoice
                .map((inv) => inv.invoiceId)
                .filter((inv) => inv); // Ensure invoice exists

            // Updated totalDue calculation
            const totalDue = invoices.reduce((sum, inv) => {
                console.log(inv)
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

            // Rest of your code remains the same
            const lastPayment = invoices
                .flatMap((inv) => inv.installmentInvoice?.payments || [])
                .filter((payment) => payment.isPaid)
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.date || 'غير متوفر';

            return {
                id: customer._id,
                name: customer.name || 'غير معروف',
                phone: customer.phoneNumber || 'غير متوفر',
                lastPaymentDate: lastPayment,
                totalDue: totalDue,
                receiptCount: invoices
                    .flatMap((inv) => inv.installmentInvoice?.payments || [])
                    .filter((payment) => payment.isPaid).length,
                status: totalDue > 0 ? 'late' : 'paid',
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
        res.status(500).json({ message: err.message });
    }
});

// 2. Process a payment for an installment
router.post('/payment', async (req, res) => {
    try {
        const { installmentId, paymentAmount } = req.body;
        const invoice = await Invoice.findById(installmentId)
        id = invoice.installmentInvoice
        // Process the payment using your existing logic
        const updatedInstallment = await processPayment(id, parseFloat(paymentAmount));

        res.status(200).json({ success: true, data: updatedInstallment });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
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
        console.log(clientData)

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
            invoice, client, role: user.role,
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

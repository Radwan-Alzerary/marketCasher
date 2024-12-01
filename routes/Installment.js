const SystemSetting = require("../models/systemSetting");
const User = require("../models/user");
const Customer = require("../models/costemer");

const router = require("express").Router();

// Mock Data
// const clients = [
//     { id: 1, name: 'جون دو', phone: '123-456-7890', lastPaymentDate: '2023-06-15', totalDue: 3000, receiptCount: 3, status: 'paid' },
//     { id: 2, name: 'جين سميث', phone: '987-654-3210', lastPaymentDate: '2023-06-01', totalDue: 5150, receiptCount: 2, status: 'late' },
//     { id: 3, name: 'أحمد محمد', phone: '555-123-4567', lastPaymentDate: '2023-07-01', totalDue: 2000, receiptCount: 1, status: 'paid' },
// ];npm

const invoices = [
    { id: 1, clientId: 1, date: '2023-06-15', total: 1000, paid: 1000, remaining: 0, status: 'paid' },
    { id: 2, clientId: 2, date: '2023-06-01', total: 2000, paid: 1000, remaining: 1000, status: 'late' },
    { id: 3, clientId: 3, date: '2023-07-01', total: 1500, paid: 1500, remaining: 0, status: 'paid' },
];

// Routes
router.get('/', async (req, res) => {
    const user = await User.findById(req.user);
    const systemSetting = await SystemSetting.findOne();
    const clients = await Customer.find()
    const view = req.query.view;
    const isCardView = view === 'card';
    res.render('Installment/index', { clients, invoices, isCardView, role: user.role, systemSetting });
});

router.get('/client/:id', async (req, res) => {
    const clientId = req.params.id;
    const user = await User.findById(req.user);
    const systemSetting = await SystemSetting.findOne();
    const clientData = await Customer.findById(clientId).populate("invoice.invoiceId")
    console.log(clientData)
    if (1) {
        res.render('Installment/client', {clientData,role: user.role, systemSetting });
    } else {
        res.status(404).send('Client not found');
    }
});

router.get('/invoice/:id', async (req, res) => {
    const invoiceId = parseInt(req.params.id, 10);
    const user = await User.findById(req.user);
    const systemSetting = await SystemSetting.findOne();

    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
        const client = clients.find(c => c.id === invoice.clientId);
        res.render('Installment/invoiceDetails', { invoice, client, clients, invoices,role: user.role, systemSetting });
    } else {
        res.status(404).send('Invoice not found');
    }
});


module.exports = router;

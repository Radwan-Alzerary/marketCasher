const router = require('express').Router();
const Category = require("../models/category");
const Food = require("../models/food");
const Table = require("../models/table");
const Delevery = require("../models/delevery");
const Setting = require("../models/pagesetting");
const Invoice = require("../models/invoice");


router.get('/', async (req, res) => {
    const setting = await Setting.findOne().sort({ number: -1 });

    if (setting.deleverytable) {
        return res.status(200).redirect(`/delevery/menu?tableid=${setting.deleverytable}`); // Redirect to a new URL
    }
    res.redirect('/')
});


router.get('/menu/', async (req, res) => {
    let tableid = req.query.tableid || '_id';
    const table = await Table.find();
    const delevery = await Delevery.find()
    const category = await Category.find().populate("foods");
    console.log(category)
    res.render('delevery-food.ejs', { category, delevery,table, tableid });
})

router.post('/addelavery', async (req, res) => {
    const deliveryname = req.body.deliveryname
    const deliverynumber = req.body.deliverynumber
    const resivename = req.body.resivename
    try {
        const delivery = new Delevery({
            deliveryname: deliveryname,
            deliverynumber: deliverynumber,
            customername: resivename,
        });
        await delivery.save();

        const existingTable = await Table.findOne({ number: 1000000 });
        if (!existingTable) {
            const table = new Table({
                number: 1000000,
            });
            const newTable = await table.save();
            const setting = await Setting.findOne().sort({ number: -1 });
            setting.deleverytable = newTable.id;
            await setting.save();

        } else {
            const setting = await Setting.findOne().sort({ number: -1 });
            setting.deleverytable = existingTable.id;
            await setting.save();
        }


        res.status(201).redirect('/setting');
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.post('/finish', async (req, res) => {
    try {
        let invoice = await Invoice.findById(req.body.invoiceId);
        // console.log(req.body);

        invoice.active = false;
        invoice.type = "توصيل";
        invoice.progressdata = Date.now();
        invoice.fullcost = req.body.totalcost;
        invoice.fulldiscont = req.body.totaldicont;
        invoice.finalcost = req.body.finalcost;
        invoice.tableid = req.body.tableId;
        invoice.deleveryCost = req.body.deleveryCost;

        const currentable = await Table.findById(invoice.tableid)

        currentable.lastinvoice = req.body.invoiceId

        const newinvoice = await invoice.save();
        await currentable.save();

        const delevery = await Delevery.findById(req.body.deleveryid)
        console.log(delevery)
        const newdeleveryinvoice = {
            id: newinvoice.id,
            customername: req.body.resivename,
            location: req.body.deloveryname,
            phoneNumber: req.body.deloveryname,
            prgress: "قيد التوصيل",
        };
        delevery.invoice.push(newdeleveryinvoice);
        await delevery.save();
        
        

        const updatedInvoice = await Table.findByIdAndUpdate(
            req.body.tableId,
            { $pull: { invoice: req.body.invoiceId } },
            { new: true }
        );

        if (!updatedInvoice) {
            return res.status(404).json({ message: 'Invoice or food item not found' });
        }


        res.json({
            message: 'finished to the invoice successfully',
        })
    } catch (err) {
        console.error(err);
        return res.json({ message: 'No invoice found in the table', err });
    }
})


module.exports = router;

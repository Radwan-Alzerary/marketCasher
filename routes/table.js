const router = require('express').Router();
const Category = require("../models/category");
const Food = require("../models/food");
const Table = require("../models/table");
const Invoice = require("../models/invoice");


router.post('/addtable', async (req, res) => {
    const table = new Table({
        number: req.body.tablenum,
    });
    try {
        const newtable = await table.save();
        res.status(201).redirect('/setting');
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
})


router.patch('/:tableId/active/', async (req, res) => {
    try {
        const table = await Table.findById(req.params.tableId);
        table.active = !table.active
        const newtable = await table.save();
        res.status(200).json({ active: newtable.active });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

router.post('/getfooddata', async (req, res) => {
    try {
        const fooddata = await Food.findById(req.body.id);
        if (!fooddata) {
            return res.status(404).json({ message: 'Food data not found' });
        }
        res.status(200).json(fooddata);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
router.post('/editfood', async (req, res) => {
    try {
        let table = await Food.findById(req.body.tableId);
        console.log(req.body);
        table.number = req.body.number

        await table.save();
        res.redirect('/food');
    } catch (err) {
        console.error(err);
        res.redirect('/food');
    }
});
router.delete('/:tableId/tableremove', async (req, res) => {
    try {
        const tableid = req.params.tableId;
        const table = await Table.findById(tableid).populate('invoice');

        if (table.invoice.length > 0) {
            const invoiceid = table.invoice[0].id;

            const invoice = await Invoice.findById(invoiceid); // Await the promise to get the actual invoice object

            invoice.active = false;
            invoice.type = "ملغى";
            invoice.progressdata = Date.now();

            const newinvoice = await invoice.save();
            console.log(newinvoice)
            const removeInvoiceFromTable = await Table.findByIdAndUpdate(
                tableid,
                { $pull: { invoice: invoiceid } },
                { new: true }
            );
        }

        await Table.findByIdAndRemove(tableid);

        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }

});

router.post('/convertable', async (req, res) => {
    try {
        const cuurentable = await Table.findById(req.body.currentable).populate("invoice")
        const newtable = await Table.findById(req.body.newtable).populate("invoice")
        if (newtable.invoice.length > 0) {
            const fromInvoice = await Invoice.findById(cuurentable.invoice[0].id)
            if (!fromInvoice) {
                throw new Error('Source invoice not found.');
            }

            const toInvoice = await Invoice.findById(newtable.invoice[0].id)
            if (!toInvoice) {
                throw new Error('Destination invoice not found.');
            }

            // Loop through each food item in the "from" invoice
            for (const foodItem of fromInvoice.food) {
                const existingFood = toInvoice.food.find((item) => item.id.toString() === foodItem.id.toString());
                // console.log(existingFood)
                if (existingFood) {
                    // Food already exists in the "to" invoice, update the quantity
                    existingFood.quantity += foodItem.quantity;
                } else {
                    // Food doesn't exist in the "to" invoice, add it
                    const newFood = {
                        id: foodItem.id,
                        quantity: foodItem.quantity,
                        discount: foodItem.discount,
                        discountType: 'cash',
                    };
                    toInvoice.food.push(newFood)
                }
            }
            await toInvoice.save()
            fromInvoice.type = 'تحويل'
            fromInvoice.active = false
            await fromInvoice.save();
        } else {
            newtable.invoice.push(cuurentable.invoice[0].id);
            await newtable.save()
        }
        await Table.findByIdAndUpdate(
            cuurentable,
            { $pull: { invoice: cuurentable.invoice[0].id } },
            { new: true }
        )


        res.redirect('/cashier');
    } catch (err) {
        console.error(err);
        res.redirect('/z');
    }
});



module.exports = router;

const router = require("express").Router();
const Category = require("../models/category");
const Food = require("../models/food");
const Table = require("../models/table");
const Invoice = require("../models/invoice");
const SystemSetting = require("../models/systemSetting");

router.post("/booking", async (req, res) => {
  try {
    const table = await Table.findById(req.body.id);
    table.book.state = !table.book.state;
    table.book.startBookedDate = Date.now();

    await table.save();
    res.json(table);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
router.post("/Families", async (req, res) => {
  try {
    const table = await Table.findById(req.body.id);
    table.Families = !table.Families;

    await table.save();
    res.json(table);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
router.post("/addtable", async (req, res) => {
  const table = new Table({
    number: req.body.tablenum,
  });
  try {
    const newtable = await table.save();
    res.status(201).redirect("/setting");
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
router.patch("/:tableId/active/", async (req, res) => {
  try {
    const table = await Table.findById(req.params.tableId);
    table.active = !table.active;
    const newtable = await table.save();
    res.status(200).json({ active: newtable.active });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});
router.post("/getfooddata", async (req, res) => {
  try {
    const fooddata = await Food.findById(req.body.id);
    if (!fooddata) {
      return res.status(404).json({ message: "Food data not found" });
    }
    res.status(200).json(fooddata);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.post("/editfood", async (req, res) => {
  try {
    let table = await Food.findById(req.body.tableId);
    table.number = req.body.number;

    await table.save();
    res.redirect("/food");
  } catch (err) {
    console.error(err);
    res.redirect("/food");
  }
});
router.delete("/:tableId/tableremove", async (req, res) => {
  try {
    const tableid = req.params.tableId;
    const table = await Table.findById(tableid).populate("invoice");

    if (table.invoice.length > 0) {
      const invoiceid = table.invoice[0].id;

      const invoice = await Invoice.findById(invoiceid); // Await the promise to get the actual invoice object

      invoice.active = false;
      invoice.type = "ملغى";
      invoice.progressdata = Date.now();

      const newinvoice = await invoice.save();
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

router.post("/convertable", async (req, res) => {
  try {
    const cuurentable = await Table.findById(req.body.currentable).populate(
      "invoice"
    );
    const newtable = await Table.findById(req.body.newtable).populate(
      "invoice"
    );
    if (newtable.invoice.length > 0) {
      const fromInvoice = await Invoice.findById(cuurentable.invoice[0].id);
      if (!fromInvoice) {
        throw new Error("Source invoice not found.");
      }

      const toInvoice = await Invoice.findById(newtable.invoice[0].id);
      if (!toInvoice) {
        throw new Error("Destination invoice not found.");
      }

      // Loop through each food item in the "from" invoice
      for (const foodItem of fromInvoice.food) {
        const existingFood = toInvoice.food.find(
          (item) => item.id.toString() === foodItem.id.toString()
        );
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
            discountType: "cash",
          };
          toInvoice.food.push(newFood);
        }
      }
      for (const foodItem of fromInvoice.dummyFood) {
        const existingFood = toInvoice.dummyFood.find(
          (item) => item.id.toString() === foodItem.id.toString()
        );
        // console.log(existingFood)
        if (existingFood) {
          // Food already exists in the "to" invoice, update the quantity
          existingFood.dummyFood += foodItem.dummyFood;
        } else {
          // Food doesn't exist in the "to" invoice, add it
          const newFood = {
            id: foodItem.id,
            quantity: foodItem.quantity,
            discount: foodItem.discount,
            discountType: "cash",
          };
          toInvoice.dummyFood.push(newFood);
        }
      }


      await toInvoice.save();
      fromInvoice.type = "تحويل";
      fromInvoice.active = false;
      await fromInvoice.save();
    } else {
      newtable.invoice.push(cuurentable.invoice[0].id);
      await newtable.save();
    }
    await Table.findByIdAndUpdate(
      cuurentable,
      { $pull: { invoice: cuurentable.invoice[0].id } },
      { new: true }
    );

    res.redirect("/cashier");
  } catch (err) {
    console.error(err);
    res.redirect("/z");
  }
});
router.get("/getall", async (req, res) => {
  const tables = await Table.find();
  const systemSetting = await SystemSetting.findOne()
  res.json({ tables, systemSetting });
});

router.get("/getByType/:type", async (req, res) => {
  const type = req.params.type
  if (type === "Families") {
    const tables = await Table.find({ Families: true });
    const systemSetting = await SystemSetting.findOne()
    res.json({ tables, systemSetting });
  } else {
    const tables = await Table.find({ $or: [{ Families: false }, { Families: { $exists: false } }] }); const systemSetting = await SystemSetting.findOne()
    res.json({ tables, systemSetting });

  }

});

router.get("/getOne/:tableId/", async (req, res) => {
  try {


    const id = req.params.tableId

    const tables = await Table.findById(id);
    res.json(tables);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.post('/editable', (req, res) => {
  // Extract form data from the request
  const { name, icon, color, iconChange, nameChange, colorChange, tablecategoryid } = req.body;

  // Here, handle any file uploads if applicable (since 'enctype="multipart/form-data"' is used)
  // For example, using `multer` to handle file uploads

  // Process the data as needed, e.g., save it to a database
  // Assuming `Table` is your model
  console.log(req.body)
  const updateData = {
    name,
    icon,
    color,
    iconChange: iconChange , // Convert checkbox values to boolean
    nameChange: nameChange ,
    colorChange: colorChange ,
    tablecategoryid
  };

  // Example database update logic
  Table.findByIdAndUpdate(tablecategoryid, updateData, { new: true })
    .then((updatedTable) => {
      res.json({ success: true, message: 'Edit successful', data: updatedTable });
    })
    .catch((error) => {
      res.status(500).json({
        message: 'Error updating table',
        error
      });
    });
});


module.exports = router;

const router = require("express").Router();
const Category = require("../models/category");
const Food = require("../models/food");
const Table = require("../models/table");
const Invoice = require("../models/invoice");
// Route: Add food to an invoice and handle invoice creation if needed
const Setting = require("../models/pagesetting");
const nodeHtmlToImage = require("node-html-to-image");
const {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
  BreakLine,
} = require("node-thermal-printer");
const puppeteer = require("puppeteer");
const purchasesInvoice = require("../models/purchasesInvoice");
const browserPromise = puppeteer.launch(); // Launch the browser once
async function printImageAsync(imagePath, printincount) {
  const setting = await Setting.findOne();

  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: `tcp://${setting.printerip}:9100`,
    characterSet: CharacterSet.SLOVENIA,
    removeSpecialCharacters: false,
    lineCharacter: "=",
    breakLine: BreakLine.WORD,
    options: {
      timeout: 2000,
    },
  });

  try {
    printer.alignCenter();
    await printer.printImage(`./public${setting.shoplogo}`); // Print PNG image
    await printer.printImage(imagePath); // Print PNG image
    await printer.cut();
    for (i = 0; i < printincount; i++) {
      await printer.execute();
    }
    console.log("Image printed successfully.");
  } catch (error) {
    console.error("Error printing image:", error);
  }
}

router.get("/list", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const lastDay = new Date();
    lastDay.setDate(lastDay.getDate() - 1);

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    const day = 12; // Specify the desired day

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    startOfDay.setDate(day);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(day + 1);

    const invoicesForDay = await Invoice.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    }).sort({ createdAt: -1 });

    let dateview = req.query.dateview || 1;

    let pagenum = req.query.page || 1;
    let state = req.query.state || "";
    let query = {};

    if (state) {
      query.type = state;
    }

    let invoice = "";
    if (dateview == "last30day") {
      invoice = await Invoice.find(
        { createdAt: { $gte: thirtyDaysAgo } },
        query
      )
        .sort({ createdAt: -1 })
        .skip((pagenum - 1) * 10)
        .limit(10);
    } else if (dateview == "lastday") {
      invoice = await Invoice.find({
        $and: [query, { createdAt: { $gte: lastDay } }],
      })
        .sort({ createdAt: -1 })
        .skip((pagenum - 1) * 10)
        .limit(10);
    } else if (dateview == "lastmonth") {
      invoice = await Invoice.find({
        $and: [query, { createdAt: { $gte: lastYear } }],
      })
        .select("-__v") // Exclude the '__v' field if it exists
        .sort({ createdAt: -1 })
        .skip((pagenum - 1) * 10)
        .limit(10);
    } else if (dateview == "lastyear") {
      invoice = await Invoice.find({ createdAt: { $gte: lastYear }, query })
        .sort({ createdAt: -1 })
        .skip((pagenum - 1) * 10)
        .limit(10);
    } else {
      invoice = await Invoice.find(query)
        .sort({ createdAt: -1 })
        .skip((pagenum - 1) * 10)
        .limit(10);
    }
    console.log(invoice);

    const purchases = await purchasesInvoice
      .find()
      .populate("storge")
      .populate("PaymentType")
      .sort({ createdAt: -1 })

    const invoiceCount = await Invoice.countDocuments();
    res.render("invoice-list", { invoice, invoiceCount, purchases });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/list/data", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const lastDay = new Date();
    lastDay.setDate(lastDay.getDate() - 1);

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    const day = 12; // Specify the desired day

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    startOfDay.setDate(day);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(day + 1);

    const invoicesForDay = await Invoice.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    }).sort({ createdAt: -1 });

    let dateview = req.query.dateview || 1;

    let pagenum = req.query.page || 1;
    let state = req.query.state || "";
    let query = {};

    if (state) {
      query.type = state;
    }

    let invoice = "";
    if (dateview == "last30day") {
      invoice = await Invoice.find(
        { createdAt: { $gte: thirtyDaysAgo } },
        query
      )
        .sort({ createdAt: -1 })
        .skip((pagenum - 1) * 10)
        .limit(10);
    } else if (dateview == "lastday") {
      invoice = await Invoice.find({
        $and: [query, { createdAt: { $gte: lastDay } }],
      })
        .sort({ createdAt: -1 })
        .skip((pagenum - 1) * 10)
        .limit(10);
    } else if (dateview == "lastmonth") {
      invoice = await Invoice.find({
        $and: [query, { createdAt: { $gte: lastYear } }],
      })
        .select("-__v") // Exclude the '__v' field if it exists
        .sort({ createdAt: -1 })
        .skip((pagenum - 1) * 10)
        .limit(10);
    } else if (dateview == "lastyear") {
      invoice = await Invoice.find({ createdAt: { $gte: lastYear }, query })
        .sort({ createdAt: -1 })
        .skip((pagenum - 1) * 10)
        .limit(10);
    } else {
      invoice = await Invoice.find(query)
        .sort({ createdAt: -1 })
        .skip((pagenum - 1) * 10)
        .limit(10);
    }
    console.log(invoice);

    const invoiceCount = await Invoice.countDocuments();
    res.json({ invoice, invoiceCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/info/:id", async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate("food.id");
  res.json(invoice);
});

router.get("/findlist/:searchtext", async (req, res) => {
  try {
    let invoice = "";
    invoice = await Invoice.find({ number: req.params.searchtext }).sort({
      createdAt: -1,
    });

    const invoiceCount = await Invoice.countDocuments();
    res.render("invoice-list", { invoice, invoiceCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/food", async (req, res) => {
  try {
    let existingFoodcheck = 0;
    const tableId = req.body.tableId;
    const { foodId, quantity, discount, discountType } = req.body;

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }
    const lastInvoice = await Invoice.findOne().sort({ number: -1 });

    let invoiceNumber;
    if (lastInvoice) {
      // If a previous invoice exists, increment the last invoice number by 1
      invoiceNumber = lastInvoice.number + 1;
    } else {
      // If no previous invoice exists, start with a default value of 1
      invoiceNumber = 1;
    }

    let invoice = null;
    if (table.invoice.length === 0) {
      // If the table does not have an invoice, create a new one
      invoice = new Invoice({
        number: invoiceNumber,
        type: "قيد المعالجة", // Replace with the appropriate type
        active: true,
      });
      await invoice.save();
      table.invoice.push(invoice._id);
      await table.save();
    } else {
      // If the table already has an invoice, use the existing one
      invoice = await Invoice.findById(table.invoice[0]);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
    }
    let updatedfoodid = "";

    // Check if the food item already exists in the invoice
    const existingFood = invoice.food.find(
      (item) => item.id.toString() === foodId
    );
    if (existingFood) {
      const foodData = await Food.findById(existingFood.id);
      updatedfoodid = foodData.id;
      existingFoodcheck = 1;
      // If the food item already exists, increment the quantity by 1
      existingFood.quantity += 1;
      await Food.findByIdAndUpdate(existingFood.id, {
        quantety: foodData.quantety - 1,
      });
    } else {
      // If the food item doesn't exist, add it to the invoice
      const food = await Food.findById(foodId);
      await Food.findByIdAndUpdate(foodId, { quantety: food.quantety - 1 });

      if (!food) {
        return res.status(404).json({ error: "Food not found" });
      }
      const newFood = {
        id: food._id,
        quantity: 1,
        discount: 0,
        foodCost: food.cost,
        discountType: discountType || "cash",
      };
      food.quantety = food.quantety - 1;
      await food.save();

      invoice.food.push(newFood);
    }

    await invoice.save();
    // Get the last added food from the invoice
    const lastAddedFood = invoice.food[invoice.food.length - 1].id;
    const editOneFood = await Food.findById(foodId);

    // Populate the last added food
    const populatedFood = await Food.findById(lastAddedFood);
    if (existingFoodcheck) {
      res.json({
        message: "alredyadd",
        food: populatedFood,
        editOneFood: editOneFood,
        newquantity: existingFood.quantity,
        invoiceId: invoice.id,
        updatedfoodid: updatedfoodid,
      });
    } else {
      const editOneFood = await Food.findById(foodId);

      res.json({
        message: "Food added to the invoice successfully",
        editOneFood: editOneFood,
        food: populatedFood,
        invoiceId: invoice.id,
        newquantity: 1,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/barcodefood", async (req, res) => {
  try {
    let existingFoodcheck = 0;
    const tableId = req.body.tableId;
    const barcodeId = req.body.barcode;
    const { quantity, discount, discountType } = req.body;
    const foodIdFromBarcode = await Food.findOne({ barcode: barcodeId });
    const foodId = foodIdFromBarcode.id;
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }
    const lastInvoice = await Invoice.findOne().sort({ number: -1 });

    let invoiceNumber;
    if (lastInvoice) {
      // If a previous invoice exists, increment the last invoice number by 1
      invoiceNumber = lastInvoice.number + 1;
    } else {
      // If no previous invoice exists, start with a default value of 1
      invoiceNumber = 1;
    }

    let invoice = null;
    if (table.invoice.length === 0) {
      // If the table does not have an invoice, create a new one
      invoice = new Invoice({
        number: invoiceNumber,
        type: "قيد المعالجة", // Replace with the appropriate type
        active: true,
      });
      await invoice.save();
      table.invoice.push(invoice._id);
      await table.save();
    } else {
      // If the table already has an invoice, use the existing one
      invoice = await Invoice.findById(table.invoice[0]);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
    }
    let updatedfoodid = "";

    // Check if the food item already exists in the invoice

    const existingFood = invoice.food.find(
      (item) => item.id.toString() === foodId
    );
    if (existingFood) {
      const foodData = await Food.findById(existingFood.id);
      updatedfoodid = foodData.id;
      existingFoodcheck = 1;
      // If the food item already exists, increment the quantity by 1
      existingFood.quantity += 1;
    } else {
      // If the food item doesn't exist, add it to the invoice
      const food = await Food.findById(foodId);
      if (!food) {
        return res.status(404).json({ error: "Food not found" });
      }
      const newFood = {
        id: food._id,
        quantity: 1,
        discount: 0,
        discountType: discountType || "cash",
      };

      invoice.food.push(newFood);
    }

    await invoice.save();

    // Get the last added food from the invoice
    const lastAddedFood = invoice.food[invoice.food.length - 1].id;

    // Populate the last added food
    const populatedFood = await Food.findById(lastAddedFood);

    if (existingFoodcheck) {
      res.json({
        message: "alredyadd",
        food: populatedFood,
        newquantity: existingFood.quantity,
        invoiceId: invoice.id,
        updatedfoodid: updatedfoodid,
      });
    } else {
      res.json({
        message: "Food added to the invoice successfully",
        food: populatedFood,
        invoiceId: invoice.id,
        newquantity: 1,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/changequantity", async (req, res) => {
  try {
    const tableId = req.body.tableId;
    const foodId = req.body.foodId;
    const quantity = req.body.quantity;
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }
    let invoice = await Invoice.findById(table.invoice[0]);

    const foodItem = invoice.food.find((item) => item.id.toString() === foodId);
    const oldQuantity = foodItem.quantity;
    if (!foodItem) {
      return res
        .status(404)
        .json({ error: "Food item not found in the invoice." });
    }
    // console.log(foodItem)
    foodItem.quantity = quantity;
    deferentValue = quantity - oldQuantity;
    console.log(deferentValue);
    const food = await Food.findById(foodId);
    if (deferentValue < 0) {
      await Food.findByIdAndUpdate(foodId, {
        quantety: food.quantety + deferentValue * -1,
      });
      console.log(food.quantety + deferentValue * -1);
    } else if (deferentValue > 0) {
      await Food.findByIdAndUpdate(foodId, {
        quantety: food.quantety - deferentValue,
      });
    }
    // Save the updated invoice
    await invoice.save();
    const editOneFood = await Food.findById(foodId);
    res.json({
      message: "quantity changed",
      editOneFood,
      foodItem,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/changedescount", async (req, res) => {
  try {
    const discount = req.body.discount;
    const invoiceid = req.body.invoiceId;

    let invoice = await Invoice.findById(invoiceid);

    invoice.discount = discount;

    // Save the updated invoice
    await invoice.save();
    res.json({
      message: "discount changed",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/changedeleverycost", async (req, res) => {
  try {
    const deleveryCost = req.body.deleveryCost;
    const invoiceid = req.body.invoiceId;

    let invoice = await Invoice.findById(invoiceid);

    invoice.deleveryCost = deleveryCost;

    // Save the updated invoice
    await invoice.save();
    res.json({
      message: "discount changed",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/price", async (req, res) => {
  try {
    const invoiceId = req.body.invoiceId;
    const invoice = await Invoice.findById(invoiceId).populate({
      path: "food.id",
      model: "Food",
    });
    let total = 0;
    let totalcost = 0;
    let totaldiscount = 0;
    for (const food of invoice.food) {
      // console.log(food)
      const quantity = food.quantity;
      const discount = food.discount;
      const price = food.id.price;
      const cost = food.id.cost;
      total += price * quantity;
      totalcost += cost * quantity;
      totaldiscount += discount * quantity;
    }
    if (invoice.discount >= 0) {
      totaldiscount += invoice.discount;
    }
    finalprice = total - totaldiscount + invoice.deleveryCost;
    if (finalprice < 0) {
      finalprice = 0;
    }

    res.json({
      total,
      totalcost,
      totaldiscount,
      finalprice,
      deleveryCost: invoice.deleveryCost,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/previesinvoice", async (req, res) => {
  try {
    const table = await Table.findById(req.body.tableId);
    console.log(table);
    if (table.invoice.length > 0) {
      return res.json({ Massage: "table have invoice", reloded: false });
    } else {
      table.invoice.push(table.lastinvoice);
      table.save();

      res.json({
        Massage: "loaded old invoice",
        reloded: true,
        lastinvoiceid: table.lastinvoice,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/cancele", async (req, res) => {
  try {
    let invoice = await Invoice.findById(req.body.invoiceId);
    // console.log(req.body);
    invoice.active = false;
    invoice.type = "ملغى";
    invoice.fullcost = req.body.totalcost;
    invoice.fulldiscont = req.body.totaldicont;
    invoice.finalcost = req.body.finalcost;
    invoice.tableid = req.body.tableId;
    invoice.progressdata = Date.now();

    const currentable = await Table.findById(invoice.tableid);

    currentable.lastinvoice = req.body.invoiceId;

    await currentable.save();

    await invoice.save();
    // console.log(req.body.tableId)
    const updatedInvoice = await Table.findByIdAndUpdate(
      req.body.tableId,
      { $pull: { invoice: req.body.invoiceId } },
      { new: true }
    );
    // console.log(updatedInvoice)

    if (!updatedInvoice) {
      return res
        .status(404)
        .json({ message: "Invoice or food item not found" });
    }

    res.json({
      message: "canciled to the invoice successfully",
    });
  } catch (err) {
    console.error(err);
    return res.json({ message: "No invoice found in the table", err });
  }
});

router.post("/finish", async (req, res) => {
  try {
    let invoice = await Invoice.findById(req.body.invoiceId);
    // console.log(req.body);

    invoice.active = false;
    invoice.type = "مكتمل";
    invoice.progressdata = Date.now();
    invoice.fullcost = req.body.totalcost;
    invoice.fulldiscont = req.body.totaldicont;
    invoice.resivename = req.body.resivename;
    invoice.finalcost = req.body.finalcost;
    invoice.foodcost = req.body.foodcost;
    invoice.tableid = req.body.tableId;

    const currentable = await Table.findById(invoice.tableid);

    currentable.lastinvoice = req.body.invoiceId;

    await invoice.save();
    await currentable.save();
    const updatedInvoice = await Table.findByIdAndUpdate(
      req.body.tableId,
      { $pull: { invoice: req.body.invoiceId } },
      { new: true }
    );

    if (!updatedInvoice) {
      return res
        .status(404)
        .json({ message: "Invoice or food item not found" });
    }

    res.json({
      message: "finished to the invoice successfully",
    });
  } catch (err) {
    console.error(err);
    return res.json({ message: "No invoice found in the table", err });
  }
});

router.post("/printinvoice", async (req, res) => {
  try {
    const htmlContent = req.body.htmbody;
    const printincount = req.body.printingcount;

    const generateImage = async () => {
      const browser = await browserPromise; // Reuse the same browser instance
      const page = await browser.newPage();
      await page.setContent(htmlContent);

      await page.waitForSelector("main"); // Wait for the <main> element to be rendered
      const mainElement = await page.$("main"); // Select the <main> element

      await mainElement.screenshot({
        path: "./image.png",
        fullPage: false, // Capture only the <main> element
        javascriptEnabled: false,
        headless: true,
      });
      console.log("Image generation done");
    };

    await generateImage(); // Generate the image asynchronously
    await printImageAsync("./image.png", printincount);
    res.status(200).json({ msg: "done" });
  } catch (err) {
    console.error(err);
    return res.json({ message: "No invoice found in the table", err });
  }
});

router.get("/:tableId/foodmenu", async (req, res) => {
  try {
    const { tableId } = req.params;
    const setting = await Setting.findOne().sort({ number: -1 });
    const table = await Table.findById(tableId).populate({
      path: "invoice",
      populate: {
        path: "food.id",
        model: "Food",
      },
    });

    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }

    if (table.invoice.length === 0) {
      return res.json({ message: "No invoice found in the table", food: [] });
    }

    const invoice = table.invoice[0];

    res.json({
      message: "Food items retrieved successfully",
      newquantity: invoice.food.quantity,
      food: invoice.food,
      invoiceid: invoice.id,
      setting,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:invoiceId/checout", async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const setting = await Setting.findOne().sort({ number: -1 });
    const invoice = await Invoice.findById(invoiceId)
      .populate({
        path: "food.id",
        model: "Food",
      })
      .populate({ path: "tableid", model: "Table" });
    console.log(invoice);
    const tableid = invoice.tableid ? invoice.tableid.number : 0
    res.json({
      message: "Food items retrieved successfully",
      tablenumber: tableid,
      invoicedate: invoice.progressdata,
      food: invoice.food,
      invoiceid: invoice.id,
      setting: setting,
      finalcost: invoice.finalcost,
      fullcost: invoice.fullcost,
      invoicenumber: invoice.number,
      fulldiscont: invoice.fulldiscont,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:tableId/:invoiceId/food/:foodId", async (req, res) => {
  try {
    const { invoiceId, foodId, tableId } = req.params;
    let invoice = await Invoice.findById(invoiceId);
    const foodItem = invoice.food.find((item) => item.id.toString() === foodId);
    const foodDetails = await Food.findById(foodId);
    console.log(foodDetails);
    await Food.findByIdAndUpdate(foodId, {
      quantety: foodDetails.quantety + foodItem.quantity,
    });
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      { $pull: { food: { id: foodId } } },
      { new: true }
    );

    if (!updatedInvoice) {
      return res
        .status(404)
        .json({ message: "Invoice or food item not found" });
    }
    const checkempty = await Invoice.findById(invoiceId);
    if (checkempty.food.length < 1) {
      await Table.findByIdAndUpdate(
        tableId,
        { $pull: { invoice: invoiceId } },
        { new: true }
      );
    }
    const editOneFood = await Food.findById(foodId);

    return res.json({ updatedInvoice, editOneFood });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.patch("/:invoiceId/editquantity/:foodId", async (req, res) => {
  try {
    const { invoiceId, foodId } = req.params;
    const quantity = req.body;

    const updatedInvoice = await Invoice.findOneAndUpdate(
      { _id: invoiceId, "food.id": foodId },
      {
        $set: {
          "food.$.quantity": quantity,
        },
      },
      { new: true }
    );

    if (!updatedInvoice) {
      return res
        .status(404)
        .json({ message: "Invoice or food item not found" });
    }

    return res.json(updatedInvoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.patch("/:invoiceId/editdiscount/:foodId", async (req, res) => {
  try {
    const { invoiceId, foodId } = req.params;
    const quantity = req.body;

    const updatedInvoice = await Invoice.findOneAndUpdate(
      { _id: invoiceId, "food.id": foodId },
      {
        $set: {
          "food.$.quantity": quantity,
        },
      },
      { new: true }
    );

    if (!updatedInvoice) {
      return res
        .status(404)
        .json({ message: "Invoice or food item not found" });
    }

    return res.json(updatedInvoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/", async (req, res) => {
  res.render("setting");
});

router.post("/deleteinvoice", async (req, res) => {
  const invoice = await Invoice.findById(req.body.id);
  invoice.deleted = true;
  invoice.type = "محذوف";
  await invoice.save();
  res.json(invoice);
});

router.post("/invoiceaovetall", async (req, res) => {
  const fromDate = new Date("2021-08-04"); // Replace with your desired from date
  const toDate = new Date("2027-08-09"); // Replace with your desired to date

  try {
    const yearlyResult = await Invoice.aggregate([
      {
        $match: {
          type: "مكتمل",
          progressdata: { $gte: fromDate, $lte: toDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          invoices: { $addToSet: "$_id" },
          foodCount: { $sum: 1 },
          foodcost: { $sum: "$foodcost" },
          sellprice: { $sum: "$finalcost" },
        },
      },
      {
        $group: {
          _id: { year: "$_id.year", month: "$_id.month" },
          yearnum: { $first: "$_id.year" },
          monthnum: { $first: "$_id.month" },
          day: {
            $push: {
              daynum: "$_id.day",
              totalCost: "$totalCost",
              foodCount: "$foodCount",
              foodcost: { $sum: "$foodcost" },
              sellprice: { $sum: "$sellprice" },
              invoices: "$invoices",
              profit: { $subtract: ["$sellprice", "$foodCost"] }, // Calculate profit
              invoiceCount: { $sum: { $size: "$invoices" } },
            },
          },
          invoiceCount: { $sum: { $size: "$invoices" } },
        },
      },
      {
        $group: {
          _id: { year: "$yearnum" },
          yearnum: { $first: "$yearnum" },
          month: {
            $push: {
              monthnum: "$monthnum",
              invoiceCount: "$invoiceCount",
              foodCount: { $sum: "$day.foodCount" },
              foodcost: { $sum: "$day.foodcost" },
              sellprice: { $sum: "$day.sellprice" },
              profit: {
                $subtract: [
                  { $sum: "$day.sellprice" },
                  { $sum: "$day.foodCost" },
                ],
              }, // Calculate profit
              day: "$day",
            },
          },
          foodCount: { $sum: "$foodCount" },
        },
      },
      {
        $group: {
          _id: null,
          year: {
            $push: {
              yearnum: "$yearnum",
              invoiceCount: { $sum: "$month.invoiceCount" },
              foodCount: { $sum: "$month.foodCount" },
              foodcost: { $sum: "$month.foodcost" },
              sellprice: { $sum: "$month.sellprice" },
              profit: {
                $subtract: [
                  { $sum: "$month.sellprice" },
                  { $sum: "$month.foodCost" },
                ],
              }, // Calculate profit
              month: "$month",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          year: 1,
        },
      },
    ]);

    const productnum = await Food.aggregate([
      {
        $match: {
          deleted: false,
          active: true,
          // progressdata: { $gte: fromDate, $lte: toDate }
        },
      },

      {
        $group: {
          _id: null,
          foodCount: { $sum: 1 },
        },
      },
    ]);

    const overallResult = await Invoice.aggregate([
      {
        $match: {
          type: "مكتمل",
          // progressdata: { $gte: fromDate, $lte: toDate }
        },
      },
      {
        $addFields: {
          foodCount: {
            $size: {
              $ifNull: ["$food.invoice", []],
            },
          },
        },
      },

      {
        $lookup: {
          from: "foods", // The name of the 'Food' collection (lowercase plural)
          localField: "food.id", // The field in the 'Invoice' collection to match
          foreignField: "_id", // The field in the 'Food' collection to match
          as: "foodDetails", // The alias for the joined documents
        },
      },
      {
        $group: {
          _id: null,
          foodCount: { $sum: 1 },
          foodCost: { $sum: "$foodcost" },
          sellprice: { $sum: "$finalcost" },
        },
      },
    ]);

    const result = {
      yearlyResult,
      overallResult: overallResult,
      productnum,
    };

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/invoiceanalysis", async (req, res) => {});

router.post("/topfoodsell", async (req, res) => {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;

  const matchStage = {
    $match: {},
  };

  // Add the condition for today's data
  if (req.body.date == "day") {
    (matchStage.$match.createdAt = {
      $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
    }),
      (matchStage.$match.type = "مكتمل");
  }

  // Add the condition for current month's data
  if (req.body.date == "month") {
    (matchStage.$match.createdAt = {
      $gte: new Date(today.getFullYear(), today.getMonth(), 1),
      $lt: new Date(today.getFullYear(), today.getMonth() + 1, 1),
    }),
      (matchStage.$match.type = "مكتمل");
  } else {
    matchStage.$match.type = "مكتمل";
  }

  Invoice.aggregate([
    matchStage,
    {
      $unwind: "$food",
    },
    {
      $group: {
        _id: "$food.id",
        foodName: { $first: "$food.name" },
        totalQuantitySold: { $sum: "$food.quantity" },
      },
    },
    {
      $lookup: {
        from: "foods", // Replace 'foods' with the name of the collection storing food details
        localField: "_id",
        foreignField: "_id",
        as: "foodDetails",
      },
    },
    {
      $unwind: "$foodDetails",
    },
    {
      $project: {
        _id: 1,
        foodName: "$foodDetails.name", // Use the actual field name in your 'Food' schema for the food name
        totalQuantitySold: 1,
      },
    },
    {
      $sort: { totalQuantitySold: -1 },
    },
    {
      $limit: 4,
    },
  ])
    .then((result) => {
      res.json(result);
    })
    .catch((error) => {
      res.status(500).json({ error: "An error occurred" });
    });
});

// Rest of the routes...
module.exports = router;

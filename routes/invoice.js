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
const isfulladmin = require("../config/auth").isfulladmin;
const isCashire = require("../config/auth").isCashire;
const ensureAuthenticated = require("../config/auth").userlogin;

const puppeteer = require("puppeteer");
const purchasesInvoice = require("../models/purchasesInvoice");
const User = require("../models/user");
const SystemSetting = require("../models/systemSetting");
const Customer = require("../models/costemer");
const paymentType = require("../models/paymentType");
const browserPromise = puppeteer.launch(); // Launch the browser once
const TelegramBot = require("node-telegram-bot-api");
const { printForRole } = require("../service/thermalPrintService");

// const token = "7011940534:AAHjtNHpdR5yzgkSX6CruBaog_blb1TjsOo";

// const bot = new TelegramBot(token, { polling: true });

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

    printer.raw(Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]));

    for (i = 0; i < printincount; i++) {
      await printer.execute();
    }

    console.log("Image printed successfully.");
  } catch (error) {
    console.error("Error printing image:", error);
  }
}
async function openCashdraw() {
  try {
    const setting = await Setting.findOne();

    if (!setting || !setting.printerip) {
      throw new Error('Printer IP is not configured.');
    }

    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `tcp://${setting.printerip}:9100`,
      characterSet: CharacterSet.SLOVENIA,
      removeSpecialCharacters: false,
      lineCharacter: "=",
      breakLine: BreakLine.WORD,
      options: {
        timeout: 2000, // You can adjust the timeout as needed
      },
    });

    // Attempt to open the cash drawer
    await printer.raw(Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]));
    console.log("Cash drawer opened successfully.");
    return { success: true, message: "Cash drawer opened successfully." };
  } catch (error) {
    console.error("Error opening cash drawer:", error);
    return { success: false, message: "Error opening cash drawer.", error: error.message };
  }
}

router.post("/openCashdraw", ensureAuthenticated, async (req, res) => {
  try {
    const result = await openCashdraw();

    if (result.success) {
      return res.status(200).json({ msg: result.message });
    } else {
      return res.status(500).json({ msg: result.message, error: result.error });
    }
  } catch (error) {
    // This catch is for any unexpected errors in the openCashdraw function
    console.error("Unexpected error:", error);
    return res.status(500).json({ msg: "Unexpected server error.", error: error.message });
  }
});


router.get("/list", ensureAuthenticated, async (req, res) => {
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

    const purchases = await purchasesInvoice
      .find()
      .populate("storge")
      .populate("PaymentType")
      .sort({ createdAt: -1 });
    const user = await User.findById(req.user);
    const systemSetting = await SystemSetting.findOne();

    const invoiceCount = await Invoice.countDocuments();
    res.render("invoice-list", {
      invoice,
      invoiceCount,
      purchases,
      role: user.role,
      systemSetting,
    });
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
    const systemSetting = await SystemSetting.findOne();

    res.render("invoice-list", { invoice, invoiceCount, systemSetting });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/food", async (req, res) => {
  try {
    let existingFoodcheck = 0;
    const tableId = req.body.tableId;
    const { foodId, fastClick, discount, discountType } = req.body;
    console.log("fastfood", fastClick)
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
      const newPaymentType = await paymentType.findOne({ name: "نقدي" });
      // If the table does not have an invoice, create a new one
      invoice = new Invoice({
        number: invoiceNumber,
        paymentType: newPaymentType.id,
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
      existingFood.quantity += (Number(fastClick) || 1);
      await Food.findByIdAndUpdate(existingFood.id, {
        quantety: foodData.quantety - (Number(fastClick) || 1),
      });
    } else {
      // If the food item doesn't exist, add it to the invoice
      const food = await Food.findById(foodId);
      await Food.findByIdAndUpdate(foodId, { quantety: food.quantety - (Number(fastClick) || 1) });

      if (!food) {
        return res.status(404).json({ error: "Food not found" });
      }
      const newFood = {
        id: food._id,
        quantity: Number(fastClick) || 1,
        discount: 0,
        foodCost: food.cost,
        foodPrice: food.price,
        discountType: discountType || "cash",
      };
      food.quantety = food.quantety - (Number(fastClick) || 1);
      await food.save();
      console.log(newFood)
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
        foodPrice: existingFood.foodPrice,
        updatedfoodid: updatedfoodid,
      });
    } else {
      const editOneFood = await Food.findById(foodId);

      res.json({
        message: "Food added to the invoice successfully",
        editOneFood: editOneFood,
        food: populatedFood,
        invoiceId: invoice.id,
        newquantity: Number(fastClick) || 1,
        foodPrice: populatedFood.price,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/dummyfood", async (req, res) => {
  try {
    let existingFoodcheck = 0;
    const tableId = req.body.tableId;
    const { foodId } = req.body;
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
      const newPaymentType = await paymentType.findOne({ name: "نقدي" });
      // If the table does not have an invoice, create a new one
      invoice = new Invoice({
        number: invoiceNumber,
        paymentType: newPaymentType.id,
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
    const existingFood = invoice.dummyFood.find(
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

      const food = await Food.findById(req.body.foodId);
      await Food.findByIdAndUpdate(foodId, { quantety: food.quantety - 1 });

      if (!food) {
        return res.status(404).json({ error: "Food not found" });
      }
      const newFood = {
        id: food._id,
        quantity: 1,
        discount: 0,
        foodCost: food.cost,
        foodPrice: food.price,
      };
      food.quantety = food.quantety - 1;
      await food.save();

      invoice.dummyFood.push(newFood);
    }

    await invoice.save();
    // Get the last added food from the invoice
    const lastAddedFood = invoice.dummyFood[invoice.dummyFood.length - 1].id;
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
        foodPrice: existingFood.foodPrice,
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
        foodPrice: populatedFood.price,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
router.post("/changeDummyFoodQuantity", async (req, res) => {
  try {
    const tableId = req.body.tableId;
    const foodId = req.body.foodId;
    const quantity = req.body.quantity;
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }
    let invoice = await Invoice.findById(table.invoice[0]);

    const foodItem = invoice.dummyFood.find((item) => item.id.toString() === foodId);
    const oldQuantity = foodItem.quantity;
    if (!foodItem) {
      return res
        .status(404)
        .json({ error: "Food item not found in the invoice." });
    }
    foodItem.quantity = quantity;
    deferentValue = quantity - oldQuantity;
    const food = await Food.findById(foodId);
    if (deferentValue < 0) {
      await Food.findByIdAndUpdate(foodId, {
        quantety: food.quantety + deferentValue * -1,
      });
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

router.post("/dummyfoodPrice", async (req, res) => {
  try {
    const invoiceId = req.body.invoiceId;
    const invoice = await Invoice.findById(invoiceId).populate({
      path: "dummyFood.id",
      model: "Food",
    });
    let total = 0;
    let totalcost = 0;
    let totaldiscount = 0;
    for (const food of invoice.dummyFood) {
      const quantity = food.quantity;
      const discount = food.discount;
      const price = food.foodPrice ? food.foodPrice : food.id.price;
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

router.delete("/:tableId/:invoiceId/dummyFood/:foodId", async (req, res) => {
  try {
    const { invoiceId, foodId, tableId } = req.params;
    let invoice = await Invoice.findById(invoiceId);
    const foodItem = invoice.dummyFood.find((item) => item.id.toString() === foodId);
    const foodDetails = await Food.findById(foodId);
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
    if (checkempty.dummyFood.length < 1) {
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

router.post("/finishDummyFood", async (req, res) => {
  try {
    // Step 1: Find all invoices with non-empty dummyFood arrays
    const table = await Table.findById(req.body.tableId);
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }
    const invoices = await Invoice.findOne().sort({ number: -1 });
    if (invoices.length === 0) {
      return res.status(200).json({ message: 'No dummyFood items to move.' });
    }

    // Counter for tracking total moved items
    let totalMovedInvoices = 0;
    let totalMovedItems = 0;

    // Step 2: Iterate over each invoice and move dummyFood to food

    // Create a Map for existing food items for quick lookup by 'id'
    const foodMap = new Map();
    invoices.food.forEach(item => {
      foodMap.set(item.id.toString(), item);
    });

    // Iterate over each dummyFood item
    invoices.dummyFood.forEach(dummyItem => {
      const foodIdStr = dummyItem.id.toString();
      if (foodMap.has(foodIdStr)) {
        // If the food item exists, sum the quantities
        const existingFood = foodMap.get(foodIdStr);
        existingFood.quantity += dummyItem.quantity;

        // Optionally, update other fields if necessary
        // For example:
        // existingFood.foodCost += dummyItem.foodCost;
        // existingFood.foodPrice += dummyItem.foodPrice;
        // existingFood.discount += dummyItem.discount;
        // existingFood.discountType = dummyItem.discountType; // or handle accordingly
      } else {
        // If the food item does not exist, add it to the food array
        invoices.food.push(dummyItem);
      }

      // Increment total moved items
      totalMovedItems += 1;
    });

    // Clear the dummyFood array
    invoices.dummyFood = [];

    // Save the updated invoice
    await invoices.save();

    // Increment moved invoices counter
    totalMovedInvoices += 1;

    // Step 3: Send success response
    res.status(200).json({
      message: `Successfully moved dummyFood items to food for ${totalMovedInvoices} invoices, totaling ${totalMovedItems} items.`,
    });
  } catch (error) {
    console.error('Error moving dummyFood to food:', error);
    res.status(500).json({
      error: 'An error occurred while moving dummyFood to food.',
      details: error.message,
    });
  }

});







router.post("/barcodefood", async (req, res) => {
  try {
    let existingFoodcheck = 0;
    const tableId = req.body.tableId;
    const barcodeId = req.body.barcode;
    const { quantity, discount, discountType } = req.body;
    let foodIdFromBarcode = await Food.findOne({ barcode: barcodeId });
    if (!foodIdFromBarcode) {
      foodIdFromBarcode = await Food.findOne({ manualBarcode: barcodeId });
    }
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
      const newPaymentType = await paymentType.findOne({ name: "نقدي" });

      invoice = new Invoice({
        number: invoiceNumber,
        paymentType: newPaymentType.id,
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
        foodPrice: existingFood.foodPrice,
        invoiceId: invoice.id,
        updatedfoodid: updatedfoodid,
      });
    } else {
      res.json({
        message: "Food added to the invoice successfully",
        food: populatedFood,
        invoiceId: invoice.id,
        newquantity: 1,
        foodPrice: populatedFood.price,
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
    foodItem.quantity = quantity;
    deferentValue = quantity - oldQuantity;
    const food = await Food.findById(foodId);
    if (deferentValue < 0) {
      await Food.findByIdAndUpdate(foodId, {
        quantety: food.quantety + deferentValue * -1,
      });
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

router.post("/changeprice", async (req, res) => {
  try {
    const tableId = req.body.tableId;
    const foodId = req.body.foodId;
    const newPrice = req.body.newPrice;
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }
    let invoice = await Invoice.findById(table.invoice[0]);

    const foodItem = invoice.food.find((item) => item.id.toString() === foodId);
    if (!foodItem) {
      return res
        .status(404)
        .json({ error: "Food item not found in the invoice." });
    }
    foodItem.foodPrice = newPrice;
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

router.post("/changeReceivedAmount", async (req, res) => {
  try {
    const amountReceived = req.body.amountReceived;
    const invoiceid = req.body.invoiceId;

    let invoice = await Invoice.findById(invoiceid);

    invoice.amountReceived = amountReceived;

    // Save the updated invoice
    await invoice.save();
    res.json({
      message: "amountReceived changed",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/changepaymentMethod", async (req, res) => {
  try {
    const invoiceid = req.body.invoiceId;

    // Find the invoice by its ID and populate the paymentType field
    let invoice = await Invoice.findById(invoiceid);
    const oldPaymentMethod = await paymentType.findById(invoice.paymentType);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    let newState = "";
    // If the invoice has no paymentType set, default it to "اجل"
    if (!invoice.paymentType) {
      const deferredPaymentType = await paymentType.findOne({ name: "اجل" });
      invoice.paymentType = deferredPaymentType._id;
    } else {
      // Check the current payment type and switch it
      if (oldPaymentMethod.name === "اجل") {
        const cashPaymentType = await paymentType.findOne({ name: "نقدي" });
        invoice.paymentType = cashPaymentType._id;
        newState = "نقدي";
      } else if (oldPaymentMethod.name === "نقدي") {
        const deferredPaymentType = await paymentType.findOne({ name: "اجل" });
        invoice.paymentType = deferredPaymentType._id;
        newState = "اجل";
      } else {
        return res.status(400).json({ error: "Invalid payment type" });
      }
    }

    // Save the updated invoice
    await invoice.save();
    res.json({
      message: "Payment method changed",
      newPaymentType: newState,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/getPaymentType", async (req, res) => {
  try {
    const invoiceId = req.query.invoiceId;
    if (req.query.invoiceId != "undefined") {
      let invoice = await Invoice.findById(invoiceId).populate("paymentType");

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      res.json({
        paymentTypeName: invoice.paymentType.name,
      });
    } else {
      res.status(403).json({ error: "no invoice" });
    }
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
      const quantity = food.quantity;
      const discount = food.discount;
      const price = food.foodPrice ? food.foodPrice : food.id.price;
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

    invoice.active = false;
    invoice.type = "مكتمل";
    invoice.progressdata = Date.now();
    invoice.fullcost = req.body.totalcost;
    invoice.fulldiscont = req.body.totaldicont;
    invoice.resivename = req.body.resivename;
    invoice.finalcost = req.body.finalcost;
    invoice.foodcost = req.body.foodcost;
    invoice.tableid = req.body.tableId;
    invoice.deloveryname = req.body.deloveryname;
    invoice.deloveryphone = req.body.deloveryphone;
    if (!invoice.resivename) {
      invoice.resivename = "زبون عام";
    }

    let custemer = await Customer.findOne({ name: invoice.resivename });
    if (!custemer) {


      custemer = new Customer({ name: invoice.resivename, phoneNumber: invoice.deloveryphone, addresses: invoice.deloveryname });
    } else {
      custemer.phoneNumber = invoice.deloveryphone
      custemer.addresses = invoice.deloveryname
      await custemer.save()
    }

    // Check if the invoiceId already exists in the customer's invoice array
    const invoiceExists = custemer.invoice.some(
      (inv) => inv.invoiceId.toString() === invoice._id.toString()
    );

    // If not, push the invoiceId to the customer's invoice array
    if (!invoiceExists) {
      custemer.invoice.push({ invoiceId: invoice._id });
      await custemer.save();
    }

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
      message: "Finished the invoice successfully",
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
    await printForRole("./image.png", "كاشير")

    await printImageAsync("./image.png", printincount);
    res.status(200).json({ msg: "done" });
  } catch (err) {
    console.error(err);
    return res.json({ message: "No invoice found in the table", err });
  }
});

router.post("/printDeleveryInvoice", async (req, res) => {
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
    await printForRole("./image.png", "دلفري")

    await printImageAsync("./image.png", printincount);
    res.status(200).json({ msg: "done" });
  } catch (err) {
    console.error(err);
    return res.json({ message: "No invoice found in the table", err });
  }
});


router.post("/printdummyinvoice", async (req, res) => {
  try {
    const htmlContent = req.body.htmbody;

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
    await printForRole("./image.png", "مطبخ")

    res.status(200).json({ msg: "done" });
  } catch (err) {
    console.error(err);
    return res.json({ message: "No invoice found in the table", err });
  }
});

router.post("/printalert1invoice", async (req, res) => {
  try {
    const htmlContent = req.body.htmbody;

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
    await printForRole("./image.png", "نداء اول")

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
      foodPrice: invoice.food.foodPrice,
      food: invoice.food,
      invoiceid: invoice.id,
      setting,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:tableId/dummyfood", async (req, res) => {
  try {
    const { tableId } = req.params;
    const setting = await Setting.findOne().sort({ number: -1 });
    const table = await Table.findById(tableId).populate({
      path: "invoice",
      populate: {
        path: "dummyFood.id",
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
      newquantity: invoice.dummyFood.quantity,
      foodPrice: invoice.dummyFood.foodPrice,
      food: invoice.dummyFood,
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
    const systemSetting = await SystemSetting.findOne();

    const invoice = await Invoice.findById(invoiceId)
      .populate({
        path: "food.id",
        model: "Food",
      })
      .populate({ path: "tableid", model: "Table" });
    const tableid = invoice.tableid ? invoice.tableid.number : 0;
    res.json({
      message: "Food items retrieved successfully",
      tableNumber: tableid,
      invoicedate: invoice.progressdata,
      food: invoice.food,
      invoiceid: invoice.id,
      tableNumber: invoice.tableid.number,
      setting: setting,
      finalcost: invoice.finalcost,
      fullcost: invoice.fullcost,
      invoicenumber: invoice.number,
      fulldiscont: invoice.fulldiscont,
      systemSetting: systemSetting,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:tableId/dummychecout", async (req, res) => {
  try {
    const tableId = req.params.tableId;
    const table = await Table.findById(tableId);
    if (!table) {
      console.log("Table not found");
      return res.status(404).json({ error: "Table not found" });
    }
    let invoice = await Invoice.findById(table.invoice[0]).populate({
      path: "dummyFood.id",
      model: "Food",
    });
    console.log(invoice)
    const setting = await Setting.findOne().sort({ number: -1 });
    const tableid = invoice.tableid ? invoice.tableid.number : 0;
    res.json({
      message: "Food items retrieved successfully",
      tableNumber: table.number,
      invoicedate: invoice.progressdata,
      food: invoice.dummyFood,
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

router.delete("/:tableId/dummyFood/:foodId", async (req, res) => {
  try {
    const { foodId, tableId } = req.params;
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }
    const invoice = await Invoice.findOne().sort({ number: -1 });
    if (invoice.length === 0) {
      return res.status(200).json({ message: 'No dummyFood items to move.' });
    }
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      invoice.id,
      { $pull: { dummyFood: { id: foodId } } },
      { new: true }
    );

    if (!updatedInvoice) {
      return res
        .status(404)
        .json({ message: "Invoice or food item not found" });
    }
    const checkempty = await Invoice.findById(invoice.id);
    if (checkempty.food.length < 1) {
      await Table.findByIdAndUpdate(
        tableId,
        { $pull: { invoice: invoice.id } },
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
  try {
    // Retrieve fromDate and toDate from request body
    const { fromDate: fromDateParam, toDate: toDateParam } = req.body;

    // Parse dates if provided
    const fromDate = fromDateParam ? new Date(fromDateParam) : null;
    const toDate = toDateParam ? new Date(toDateParam) : null;

    // Build date range filter
    const dateFilter = {};
    if (fromDate) dateFilter.$gte = fromDate;
    if (toDate) dateFilter.$lte = toDate;
    // Construct match filters for Invoice and Food collections
    const invoiceMatchFilter = {
      type: { $in: ["مكتمل", "توصيل"] }
    };
    if (fromDate || toDate) {
      invoiceMatchFilter.progressdata = dateFilter;
    }

    const foodMatchFilter = { deleted: false, active: true };
    if (fromDate || toDate) {
      foodMatchFilter.progressdata = dateFilter;
    }

    // Invoice Aggregation Pipeline
    const yearlyResult = await Invoice.aggregate([
      { $match: invoiceMatchFilter },
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
              foodCount: "$foodCount",
              foodcost: "$foodcost",
              sellprice: "$sellprice",
              invoices: "$invoices",
              profit: { $subtract: ["$sellprice", "$foodcost"] },
              invoiceCount: { $size: "$invoices" },
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
                  { $sum: "$day.foodcost" },
                ],
              },
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
                  { $sum: "$month.foodcost" },
                ],
              },
              month: "$month",
            },
          },
        },
      },
      { $project: { _id: 0, year: 1 } },
    ]);

    // Food Aggregation Pipeline
    const productnum = await Food.aggregate([
      { $match: foodMatchFilter },
      {
        $group: {
          _id: null,
          foodCount: { $sum: 1 },
        },
      },
    ]);

    // Overall Invoice Aggregation
    const overallResult = await Invoice.aggregate([
      { $match: invoiceMatchFilter },
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
          from: "foods",
          localField: "food.id",
          foreignField: "_id",
          as: "foodDetails",
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

    // Construct the final result
    const result = {
      yearlyResult,
      overallResult,
      productnum,
    };

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.post("/invoiceanalysis", async (req, res) => { });

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

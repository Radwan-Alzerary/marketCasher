const Supplier = require("../models/Supplier");
const Category = require("../models/category");
const Food = require("../models/food");
const PaymentType = require("../models/paymentType");
const purchasesInvoice = require("../models/purchasesInvoice");
const PurchasesInvoice = require("../models/purchasesInvoice");
const Storge = require("../models/storge");

const router = require("express").Router();

router.get("/", async (req, res) => {
  const supplier = await Supplier.find();
  const storge = await Storge.find();
  const paymentType = await PaymentType.find();
  const categorys = await Category.find();
  const defaultStorge = await Storge.findOne({ name: "منتجات" });
  const defaultPayment = await PaymentType.findOne({ name: "نقدي" });
  try {
    const state = "قيد المعالجة"; // Set the desired state
    // Check if there is an existing purchase invoice with the specified state
    const existingInvoice = await PurchasesInvoice.findOne({ state });

    if (existingInvoice) {
      res.render("purchases", {
        supplier,
        storge,
        paymentType,
        categorys,
        invoice: existingInvoice,
      });
    } else {
      const newInvoice = new PurchasesInvoice({
        state,
        PaymentType: defaultPayment.id,
        storge: defaultStorge.id,
        invoiceDate: new Date(),
      });
      await newInvoice.save();
      res.render("purchases", {
        supplier,
        storge,
        paymentType,
        categorys,
        invoice: newInvoice,
      });
    }
  } catch (error) {
    console.error("Error adding item to purchase invoice:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.post("/finish", async (req, res) => {
  console.log(req.body);
  try {
    let costCount = 0;
    let quantityCount = 0;
    let discountCount = 0;
    let giftCount = 0;
    let returnCount = 0;
    const updatedInvoice = await purchasesInvoice
      .findById(req.body.id)
      .populate("items.id");

    // Use a for...of loop instead of forEach to handle asynchronous operations
    for (const item of updatedInvoice.items) {
      const foodInside = await Food.findById(item.id.id);
      foodInside.quantety += item.quantity;
      costCount += (item.cost * item.quantity)-item.discount;
      quantityCount += item.quantity;
      discountCount += item.discount;
      giftCount += item.gift;
      returnCount += item.return;
      // Save the changes to the foodInside document
      await foodInside.save();
    }
    const newupdatedInvoice = await purchasesInvoice
      .findByIdAndUpdate(req.body.id, {
        state: "مكتمل",
        fullCost: costCount,
        fullquantity: quantityCount,
        fulldiscount: discountCount,
        fullgift: giftCount,
        fullreturn: returnCount,
      })
      .populate("items.id");

    res.redirect("/purchases");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/cancele", async (req, res) => {
  try {
    await purchasesInvoice.findByIdAndUpdate(req.body.id, {
      state: "ملغى",
    });
    res.redirect("/purchases");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/items/", async (req, res) => {
  const existingInvoice = await PurchasesInvoice.findOne({
    state: "قيد المعالجة",
  }).populate("items.id");

  res.json(existingInvoice);
});
router.post("/updatedata", async (req, res) => {
  try {
    await purchasesInvoice.findByIdAndUpdate(req.body.id, {
      [req.body.type]: req.body.value,
    });
    res.status(200).json({ success: "updateDone" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/add-item", async (req, res) => {
  try {
    const itemData = req.body; // Assuming you are sending the item data in the request body
    const item = await Food.findById(req.body.id);
    const state = "قيد المعالجة"; // Set the desired state

    // Check if there is an existing purchase invoice with the specified state
    const existingInvoice = await PurchasesInvoice.findOne({ state });

    if (existingInvoice) {
      // Check if the item already exists in the items array
      const existingItem = existingInvoice.items.find((item) =>
        item.id.equals(itemData.id)
      );

      if (existingItem) {
        // If the item exists, increase the quantity
        existingItem.quantity += 1;
      } else {
        // If the item does not exist, add it to the items array
        existingInvoice.items.push(itemData);
      }

      await existingInvoice.save();
      res.status(200).json({ success: true, existingInvoice });
    } else {
      itemData.cost = item.cost;

      // If no invoice exists, create a new one and add the item to it
      const newInvoice = new PurchasesInvoice({
        state,
        items: [itemData],
      });
      await newInvoice.save();
      res.status(200).json({ success: true, newInvoice });
    }
  } catch (error) {
    console.error("Error adding item to purchase invoice:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.post("/add-item-barcode", async (req, res) => {
  try {
    const itemData = req.body; // Assuming you are sending the item data in the request body
    const item = await Food.findOne({ barcode: req.body.id });
    itemData.id = item.id;
    const state = "قيد المعالجة"; // Set the desired state
    console.log(item);
    // Check if there is an existing purchase invoice with the specified state
    const existingInvoice = await PurchasesInvoice.findOne({ state });
    if (existingInvoice) {
      // Check if the item already exists in the items array
      const existingItem = existingInvoice.items.find((item) =>
        item.id.equals(itemData.id)
      );

      if (existingItem) {
        // If the item exists, increase the quantity
        existingItem.quantity += 1;
      } else {
        // If the item does not exist, add it to the items array
        existingInvoice.items.push(itemData);
      }

      await existingInvoice.save();
      res.status(200).json({ success: true, existingInvoice });
    } else {
      itemData.cost = item.cost;

      // If no invoice exists, create a new one and add the item to it
      const newInvoice = new PurchasesInvoice({
        state,
        items: [itemData],
      });
      await newInvoice.save();
      res.status(200).json({ success: true, newInvoice });
    }
  } catch (error) {
    console.error("Error adding item to purchase invoice:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.post("/editvalue", async (req, res) => {
  const existingInvoice = await PurchasesInvoice.findById(req.body.invoiceId);

  if (existingInvoice) {
    // Check if the item already exists in the items array
    const existingItem = existingInvoice.items.find((item) =>
      item.id.equals(req.body.inputId)
    );
    existingItem[req.body.inputType] = req.body.value;
    await existingInvoice.save();
    console.log(existingItem.cost);
    console.log(existingItem.discount);
    console.log(existingItem.gift);
    console.log(existingItem.quantity);
    const newTotal =
      existingItem.cost * existingItem.quantity - existingItem.discount;
    res.status(200).json({ success: true, existingInvoice, newTotal });
  }
  console.log(req.body);
});

router.get("/invoiceprice/:invoiceId", async (req, res) => {
  const invoiceId = req.params.invoiceId;

  try {
    const invoice = await PurchasesInvoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Calculate the totals using the aggregation framework
    const result = await PurchasesInvoice.aggregate([
      { $match: { _id: invoice._id } },
      {
        $project: {
          itemsTotal: {
            $reduce: {
              input: "$items",
              initialValue: {
                totalCost: 0,
                totalQuantity: 0,
                totalDiscount: 0,
                totalGift: 0,
                totalReturn: 0,
              },
              in: {
                totalCost: { $add: ["$$value.totalCost", "$$this.cost"] },
                totalQuantity: {
                  $add: ["$$value.totalQuantity", "$$this.quantity"],
                },
                totalDiscount: {
                  $add: ["$$value.totalDiscount", "$$this.discount"],
                },
                totalGift: { $add: ["$$value.totalGift", "$$this.gift"] },
                totalReturn: { $add: ["$$value.totalReturn", "$$this.return"] },
              },
            },
          },
          itemsTotalPrice: {
            $subtract: [
              {
                $multiply: [
                  "$itemsTotal.totalCost",
                  "$itemsTotal.totalQuantity",
                ],
              },
              "$itemsTotal.totalDiscount",
            ],
          },
        },
      },
    ]);

    if (result.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to remove an item from the items array in a purchasesInvoice by ID
router.delete("/delete/:invoiceId/items/:itemId", async (req, res) => {
  const purchasesInvoiceId = req.params.invoiceId;
  const itemIdToRemove = req.params.itemId;

  try {
    const result = await PurchasesInvoice.findByIdAndUpdate(
      purchasesInvoiceId,
      { $pull: { items: { id: itemIdToRemove } } },
      { new: true }
    ).populate("items.id", "name description otherFields");

    if (!result) {
      return res.status(404).json({ message: "purchasesInvoice not found" });
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;

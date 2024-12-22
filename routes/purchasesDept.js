// routes/invoices.js
const express = require("express");
const router = express.Router();
const purchasesInvoice = require("../models/purchasesInvoice"); // Adjust the path if needed
const User = require("../models/user");
const SystemSetting = require("../models/systemSetting");
const paymentType = require("../models/paymentType");

// GET all invoices
router.get("/", async (req, res) => {
    const user = await User.findById(req.user);
    const systemSetting = await SystemSetting.findOne();
  
    res.render("purchasesDept",{ role: user.role,systemSetting });
});


// GET all invoices
router.get("/getInvoice", async (req, res) => {
    try {
        // Populate references if needed (PaymentType, storge, items.id, etc.)
        const payment = await paymentType.findOne({name:"اجل"})
        console.log(payment)
        const allInvoices = await purchasesInvoice.find({PaymentType:payment.id})
            .populate("PaymentType")
            .populate("storge")
            .populate("items.id");

        return res.json(allInvoices);
    } catch (error) {
        console.error("Error getting invoices:", error);
        return res.status(500).json({ error: "Server error" });
    }
});

// GET single invoice by ID
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const invoice = await purchasesInvoice.findById(id)
            .populate("PaymentType")
            .populate("storge")
            .populate("items.id");

        if (!invoice) {
            return res.status(404).json({ error: "Invoice not found" });
        }
        return res.json(invoice);
    } catch (error) {
        console.error("Error getting invoice by ID:", error);
        return res.status(500).json({ error: "Server error" });
    }
});

// POST a new invoice (if you want to create new invoices)
router.post("/", async (req, res) => {
    try {
        // You can customize how you receive data from the frontend
        const newInvoice = new purchasesInvoice(req.body);
        await newInvoice.save();
        return res.status(201).json(newInvoice);
    } catch (error) {
        console.error("Error creating new invoice:", error);
        return res.status(500).json({ error: "Server error" });
    }
});

// POST a new payment for a specific invoice
router.post("/:id/payments", async (req, res) => {
    const { id } = req.params;
    const { date, PaymentValue, note } = req.body;

    try {
        const invoice = await purchasesInvoice.findById(id);
        if (!invoice) {
            return res.status(404).json({ error: "Invoice not found" });
        }

        // Add the new payment
        invoice.PayOffDebts.push({
            date: date,
            PaymentValue: PaymentValue,
            note: note
        });

        // Save and return updated invoice
        await invoice.save();

        // re-populate if you want to send updated fields
        const updatedInvoice = await purchasesInvoice.findById(id)
            .populate("PaymentType")
            .populate("storge")
            .populate("items.id");

        return res.json(updatedInvoice);
    } catch (error) {
        console.error("Error adding payment:", error);
        return res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;

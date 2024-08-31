const Customer = require("../models/costemer");
const Invoice = require("../models/invoice");
const paymentType = require("../models/paymentType");
const SystemSetting = require("../models/systemSetting");
const User = require("../models/user");

const router = require("express").Router();
const isfulladmin = require("../config/auth").isfulladmin;

const ensureAuthenticated = require("../config/auth").userlogin;

router.get(
  "/PurchaseDebts",
  ensureAuthenticated,
  isfulladmin,
  async (req, res) => {
    const user = await User.findById(req.user);
    const systemSetting = await SystemSetting.findOne();

    res.render("PurchaseDebts", { role: user.role, systemSetting });
  }
);
router.get(
  "/SalesDebts",
  ensureAuthenticated,
  isfulladmin,
  async (req, res) => {
    const user = await User.findById(req.user);
    const systemSetting = await SystemSetting.findOne();
    try {
      const deptPaymentType = await paymentType.findOne({ name: "اجل" });
      const customers = await Customer.find()
        .populate({
          path: "invoice.invoiceId",
          match: { paymentType: deptPaymentType.id },
        })
        .exec();

      // Filter out customers who don't have any 'اجل' invoices
      const filteredCustomers = customers.filter((customer) =>
        customer.invoice.some((inv) => inv.invoiceId !== null)
      );
      res.render("SalesDebts", {
        role: user.role,
        systemSetting,
        filteredCustomers,
      });
    } catch (error) {
      console.error("Error fetching customers with 'اجل' invoices:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.post(
  "/fullDebtPayment",
  ensureAuthenticated,
  isfulladmin,
  async (req, res) => {
    const customerId = req.body.costemerId;
    console.log(req.body.costemerId);
    try {
      // Find the customer by ID
      const customer = await Customer.findById(customerId);
      const fullPaymentType = await paymentType.findOne({ name: "نقدي" });
      for (const [index, invoice] of customer.invoice.entries()) {
        const updatedInvoice = await Invoice.findById(
          invoice.invoiceId.toString()
        );
        if (updatedInvoice.paymentType == fullPaymentType.id) {
          continue;
        }
        updatedInvoice.paymentType = fullPaymentType.id;
        updatedInvoice.amountReceived = updatedInvoice.finalcost;
        await updatedInvoice.save();
      }

      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Wait for all invoices to be updated

      res.status(200).json({ message: "All invoices updated to نقدي" });
    } catch (error) {
      console.error("Error updating invoices:", error);
      res.status(500).json({ message: "Server error", error });
    }
  }
);

router.post(
  "/AmountPayment",
  ensureAuthenticated,
  isfulladmin,
  async (req, res) => {
    const customerId = req.body.costemerId;
    let amount = Number(req.body.amount);
    console.log(req.body);
    try {
      // Find the customer by ID
      const customer = await Customer.findById(customerId);
      const fullPaymentType = await paymentType.findOne({ name: "نقدي" });
      for (const [index, invoice] of customer.invoice.entries()) {
        const updatedInvoice = await Invoice.findById(
          invoice.invoiceId.toString()
        );
        if (updatedInvoice.paymentType == fullPaymentType.id) {
          continue;
        }
        //   updatedInvoice.paymentType = fullPaymentType.id;
        if (amount >= updatedInvoice.finalcost - updatedInvoice.amountReceived) {
          amount =
            amount - (updatedInvoice.finalcost - updatedInvoice.amountReceived);
          updatedInvoice.amountReceived = updatedInvoice.finalcost;
          updatedInvoice.paymentType = fullPaymentType.id
          await updatedInvoice.save();
        } else {
          updatedInvoice.amountReceived =
            updatedInvoice.amountReceived + amount;
          await updatedInvoice.save();
          break;
        }
      }

      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Wait for all invoices to be updated

      res.status(200).json({ message: "All invoices updated to نقدي" });
    } catch (error) {
      console.error("Error updating invoices:", error);
      res.status(500).json({ message: "Server error", error });
    }
  }
);

module.exports = router;

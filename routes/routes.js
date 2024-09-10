const router = require("express").Router();
const Setting = require("../models/pagesetting");
const Invoice = require("../models/invoice");
const Food = require("../models/food");
const Category = require("../models/category");
const User = require("../models/user");
const SystemSetting = require("../models/systemSetting");
const isfulladmin = require("../config/auth").isfulladmin;
const isCashire = require("../config/auth").isCashire;
const ensureAuthenticated = require("../config/auth").userlogin;

router.get("/", ensureAuthenticated, async (req, res) => {
  const category = await Category.find().populate("foods");
  const food = await Food.find({
    quantety: { $gte: 0, $lte: 5 },
    unlimit: false,
  });
  const user = await User.findById(req.user);
  const systemSetting = await SystemSetting.findOne();
  console.log(category);
  res.render("dashboard", { category, food, role: user.role,systemSetting });
});
router.get("/a4print", async (req, res) => {
  res.render("A4Invoice");
});



router.get("/updateinvoicecost", async (req, res) => {
  try {
    const invoices = await Invoice.find({
      foodcost: { $exists: false },
    }).populate("food.id");

    for (const invoice of invoices) {
      let totalFoodCost = 0;
      for (const foodItem of invoice.food) {
        if (foodItem.id && foodItem.id.cost && foodItem.quantity) {
          totalFoodCost += foodItem.id.cost * foodItem.quantity;
        }
      }
      invoice.foodcost = totalFoodCost;
      await invoice.save();
    }

    res.json({ message: "Food costs added to invoices successfully." });
  } catch (error) {
    res.status(500).json({ error: "Error adding food costs to invoices." });
  }
});

module.exports = router;

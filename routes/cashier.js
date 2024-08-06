const router = require("express").Router();
const Category = require("../models/category");
const Food = require("../models/food");
const SystemSetting = require("../models/systemSetting");
const Table = require("../models/table");
const User = require("../models/user");
const isfulladmin = require("../config/auth").isfulladmin;
const isCashire = require("../config/auth").isCashire;
const ensureAuthenticated = require("../config/auth").userlogin;

router.get("/", async (req, res) => {
  const category = await Category.find().populate("foods");
  const user = await User.findById(req.user);
  const systemSetting = await SystemSetting.findOne();
  const table = await Table.find().sort({ number: 1 }); // Sort the tables by number in ascending order
  console.log(category);
  res.render("cashier-table", {
    category,
    table,
    role: user.role,
    systemSetting: systemSetting,
  });
});

router.get("/menu/", async (req, res) => {
  let tableid = req.query.tableid || "_id";
  const systemSetting = await SystemSetting.findOne();

  // const table = await Table.findById(tableid).populate("invoice");
  const table = await Table.find();
  const user = await User.findById(req.user);

  const category = await Category.find().populate("foods");
  console.log(category);

  res.render("cashier-food", { category, table, tableid, role: user.role,systemSetting:systemSetting });
});

module.exports = router;

const router = require("express").Router();
const Category = require("../models/category");
const Food = require("../models/food");
const Table = require("../models/table");
const Invoice = require("../models/invoice");
const Setting = require("../models/systemSetting");
const Delevery = require("../models/delevery");
const User = require("../models/user");

router.get("/", async (req, res) => {
  const table = await Table.find();
  const setting = await Setting.find();
  const user = await User.findById(req.user);
  console.log(user);
  const delevery = await Delevery.find();
  if (setting.length < 1) {
    const newSetting = new Setting({});
    try {
      const setting = await newSetting.save();
      console.log(setting);
      res.render("setting", { table, setting, role: user.role });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
  res.render("setting", { table, setting, delevery, role: user.role });
});

module.exports = router;

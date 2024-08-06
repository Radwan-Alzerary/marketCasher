const router = require("express").Router();
const Category = require("../models/category");
const Food = require("../models/food");
const foodcontroll = require("../controllers/food.controll");
const multer = require("multer");
const fs = require("fs");
const User = require("../models/user");
const SystemSetting = require("../models/systemSetting");

const isfulladmin = require("../config/auth").isfulladmin;
const isCashire = require("../config/auth").isCashire;
const ensureAuthenticated = require("../config/auth").userlogin;

// Set up multer storage engine for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/img/foodimg");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = file.originalname.split(".").pop();
    cb(null, uniqueSuffix + "." + extension);
  },
});

// Create multer instance for uploading image
const upload = multer({ storage: storage });
router.get("/", ensureAuthenticated, isfulladmin, async (req, res) => {
  console.log(req.user);
  const user = await User.findById(req.user);
  const systemSetting = await SystemSetting.findOne();
  const category = await Category.find().populate("foods");
  const food = await Food.find({
    quantety: { $gte: 0, $lte: 5 },
    unlimit: false,
    deleted:false
  });
  console.log(category);
  res.render("dashboard", { category, food, role: user.role,systemSetting });
});

module.exports = router;

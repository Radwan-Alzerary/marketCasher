const router = require("express").Router();
const Storge = require("../models/storge");
const Food = require("../models/food");
const foodcontroll = require("../controllers/food.controll");
const multer = require("multer");
const fs = require("fs");
const User = require("../models/user");
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
  const storge = await Storge.find();
  const user = await User.findById(req.user);

  res.render("storge", { storge, role: user.role });
});

module.exports = router;

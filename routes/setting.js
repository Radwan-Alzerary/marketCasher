const router = require("express").Router();
const Category = require("../models/category");
const Food = require("../models/food");
const Table = require("../models/table");
const Invoice = require("../models/invoice");
const Setting = require("../models/pagesetting");
const Delevery = require("../models/delevery");
const isfulladmin = require("../config/auth").isfulladmin;
const isCashire = require("../config/auth").isCashire;
const ensureAuthenticated = require("../config/auth").userlogin;
const mongoose = require("mongoose");

// const Sitting = require("../models/pagesitting");
const multer = require("multer");
const fs = require("fs");
const User = require("../models/user");
const SystemSetting = require("../models/systemSetting");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/img/websiteimg");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = file.originalname.split(".").pop();
    cb(null, uniqueSuffix + "." + extension);
  },
});
const upload = multer({ storage: storage });
router.post("/update", upload.single("image"), async (req, res) => {
  try {
    const setting = await Setting.findOne().sort({ number: -1 });
    setting.shopname = req.body.name;
    setting.printerip = req.body.printerip;
    setting.adress = req.body.adress;
    setting.phonnumber = req.body.phonnumber;
    setting.invoicefooter = req.body.invoicefooter;
    setting.barcodeXsize = req.body.barcodeXsize;
    setting.barcodeYsize = req.body.barcodeYsize;
    if (req.file) {
      // Delete the previous image if it exists
      console.log(req.file);
      // Add the new image to the project
      setting.shoplogo = "/img/websiteimg/" + req.file.filename;
    }

    await setting.save();
    res.redirect("/setting");
  } catch (err) {
    console.error(err);
    res.redirect("/setting");
  }
});

router.get("/", async (req, res) => {
  const table = await Table.find();
  const setting = await Setting.find();
  const user = await User.findById(req.user);
  const systemSetting = await SystemSetting.findOne();

  console.log(user);
  const delevery = await Delevery.find();
  if (setting.length < 1) {
    const newSetting = new Setting({});
    try {
      const setting = await newSetting.save();
      console.log(setting);
      res.render("setting", { table, setting, role: user.role, systemSetting });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
  res.render("setting", {
    table,
    setting,
    delevery,
    role: user.role,
    systemSetting,
  });
});

router.get("/getsetting", async (req, res) => {
  const setting = await Setting.findOne();
  res.json(setting);
});



router.get("/exportdata", async (req, res) => {
  try {
    const modelNames = mongoose.modelNames();

    // Ensure the data directory exists
    const dataDirectory = "../backup";
    if (!fs.existsSync(dataDirectory)) {
      fs.mkdirSync(dataDirectory);
    }

    const exportPromises = modelNames.map(async (modelName) => {
      const Model = mongoose.model(modelName);
      const data = await Model.find({});
      const dataPath = `../backup/${modelName}.json`;

      // Write the data to the file
      fs.writeFileSync(dataPath, JSON.stringify(data));

      console.log(`Exported ${modelName} to ${dataPath}`);
    });

    await Promise.all(exportPromises);
    await SystemSetting.findOneAndUpdate({}, { lastBackup: Date.now() });

    res.status(200).json({ message: "All models exported successfully" });
  } catch (error) {
    console.error("Error exporting models", error);
    res.status(500).json({ error: "Error exporting models", details: error });
  }
});

router.get("/importdata", async (req, res) => {
  try {
    const modelNames = mongoose.modelNames();

    for (const modelName of modelNames) {
      const dataPath = `../backup/${modelName}.json`;

      // Read the JSON data from the file
      const rawData = fs.readFileSync(dataPath, "utf8");
      const data = JSON.parse(rawData);

      const Model = mongoose.model(modelName);

      // Clear existing data in the model (optional, depending on your needs)
      await Model.deleteMany({});

      // Insert the data into the model
      await Model.insertMany(data);

      console.log(`Imported data for ${modelName}`);
    }

    res.status(200).json({ message: "Data imported successfully" });
  } catch (error) {
    console.error("Error importing data", error);
    res.status(500).json({ error: "Error importing data", details: error });
  }
});


module.exports = router;

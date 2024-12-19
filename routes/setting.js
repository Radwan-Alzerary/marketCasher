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
const Device = require("../models/devices");
const path = require('path');
const fsPromises = require('fs').promises;

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
    console.log(req.body.closedTimeOffset)
    const setting = await Setting.findOne().sort({ number: -1 });
    setting.shopname = req.body.name;
    setting.printerip = req.body.printerip;
    setting.adress = req.body.adress;
    setting.phonnumber = req.body.phonnumber;
    setting.invoicefooter = req.body.invoicefooter;
    setting.barcodeXsize = req.body.barcodeXsize;
    setting.barcodeYsize = req.body.barcodeYsize;
    setting.printerType = req.body.printerType;
    setting.amountUnit = req.body.amountUnit;
    setting.closedTimeOffset = req.body.closedTimeOffset;
    setting.printerActive = req.body.printerActive || false;
    setting.useInvoiceNumber = req.body.useInvoiceNumber || false;
    setting.mainCurrency = req.body.mainCurrency ;
    setting.buyCurrency = req.body.buyCurrency ;
    setting.sellCurrency = req.body.sellCurrency ;
    setting.ExchangeRate = req.body.ExchangeRate ;

    console.log(req.body)
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
  const devices = await Device.find({});

  console.log(user);
  const delevery = await Delevery.find();
  if (setting.length < 1) {
    const newSetting = new Setting({});
    try {
      const setting = await newSetting.save();
      console.log(setting);
      res.render("setting", { table, setting, role: user.role, systemSetting, devices: devices });
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
    devices
  });
});

router.get("/getsetting", async (req, res) => {
  const setting = await Setting.findOne();
  res.json(setting);
});




router.get("/exportdata", async (req, res) => {
  try {
    const modelNames = mongoose.modelNames();
    const dataDirectory = req.query.path || "../backup";

    // Ensure absolute path
    const absolutePath = path.resolve(dataDirectory);

    try {
      // Create all directories in the path if they don't exist
      await fsPromises.mkdir(absolutePath, { recursive: true });
      console.log(`Directory created or already exists at ${absolutePath}`);
    } catch (err) {
      throw new Error(`Failed to create directory: ${err.message}`);
    }

    const exportPromises = modelNames.map(async (modelName) => {
      const Model = mongoose.model(modelName);
      const data = await Model.find({});
      const dataPath = path.join(absolutePath, `${modelName}.json`);

      try {
        // Write the data to the file with pretty formatting
        await fsPromises.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Exported ${modelName} to ${dataPath}`);
      } catch (err) {
        throw new Error(`Failed to write file ${modelName}.json: ${err.message}`);
      }
    });

    await Promise.all(exportPromises);
    await mongoose.model('systemSetting').findOneAndUpdate({}, { lastBackup: Date.now() }, { upsert: true });

    res.status(200).json({ 
      success: true,
      message: "All models exported successfully",
      path: absolutePath 
    });

  } catch (error) {
    console.error("Error exporting models:", error);
    res.status(500).json({ 
      success: false,
      error: "Error exporting models", 
      details: error.message 
    });
  }
});
router.get("/importdata", async (req, res) => {
  try {
    const modelNames = mongoose.modelNames();
    const dataDirectory = req.query.path || "../backup";
    const absolutePath = path.resolve(dataDirectory);

    // Check if directory exists
    try {
      await fs.access(absolutePath);
    } catch (err) {
      throw new Error(`Backup directory not found: ${absolutePath}`);
    }

    for (const modelName of modelNames) {
      const dataPath = path.join(absolutePath, `${modelName}.json`);

      try {
        // Check if file exists
        await fs.access(dataPath);
      } catch (err) {
        console.log(`Skipping ${modelName}: No backup file found at ${dataPath}`);
        continue;
      }

      try {
        // Read and parse the JSON data
        const rawData = await fs.readFile(dataPath, 'utf8');
        const data = JSON.parse(rawData);

        const Model = mongoose.model(modelName);

        // Clear existing data in the model
        await Model.deleteMany({});

        // Insert the data into the model
        await Model.insertMany(data);

        console.log(`Imported data for ${modelName}`);
      } catch (err) {
        throw new Error(`Error processing ${modelName}: ${err.message}`);
      }
    }

    res.status(200).json({ 
      success: true,
      message: "Data imported successfully",
      path: absolutePath
    });

  } catch (error) {
    console.error("Error importing data:", error);
    res.status(500).json({ 
      success: false,
      error: "Error importing data", 
      details: error.message 
    });
  }
});

module.exports = router;

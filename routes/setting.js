const router = require('express').Router();
const Category = require("../models/category");
const Food = require("../models/food");
const Table = require("../models/table");
const Invoice = require("../models/invoice");
const Setting = require("../models/pagesetting");
const Delevery = require("../models/delevery");

// const Sitting = require("../models/pagesitting");
const multer = require('multer');
const fs = require('fs');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/img/websiteimg');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const extension = file.originalname.split('.').pop();
        cb(null, uniqueSuffix + '.' + extension);
    }
});
const upload = multer({ storage: storage });
  router.post('/update', upload.single('image'), async (req, res) => {
    try {
      const setting = await Setting.findOne().sort({ number: -1 });
      setting.shopname = req.body.name
      setting.printerip = req.body.printerip
      setting.adress = req.body.adress
      setting.phonnumber = req.body.phonnumber
      setting.invoicefooter = req.body.invoicefooter
      if (req.file) {
        // Delete the previous image if it exists
        console.log(req.file)
        // Add the new image to the project
        setting.shoplogo = '/img/websiteimg/' + req.file.filename;
      }
    
      await setting.save();
      res.redirect('/setting');
    } catch (err) {
      console.error(err);
      res.redirect('/setting');
    }
  });

router.get('/', async (req, res) => {
  const table = await Table.find();
  const setting = await Setting.find();
  const delevery = await Delevery.find();
  if (setting.length < 1) {
    const newSetting = new Setting({});
    try {
      const setting = await newSetting.save();
      console.log(setting)
      res.render('setting', { table, setting });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
  res.render('setting', { table, setting,delevery });

})




module.exports = router;

// routes/devices.js

const express = require("express");
const router = express.Router();
const Device = require("../models/devices");
const User = require("../models/user");

// Device Types and Roles
const deviceTypes = ["A4 Printer", "Thermal Printer"];
const deviceRoles = ["كاشير", "دلفري", "مطبخ", "نداء اول", "نداء ثاني"];
const connectionTypes = ["USB", "Ethernet", "Wi-Fi"];
const SystemSetting = require("../models/systemSetting");

/* CREATE */

// Show form to create new device
router.get("/new",async (req, res) => {
    const user = await User.findById(req.user);
    const systemSetting = await SystemSetting.findOne();

  res.render("devices/new", { deviceTypes, deviceRoles, connectionTypes,role: user.role ,systemSetting });
});

// Add new device to DB
router.post("/", async (req, res) => {
  try {
    const newDevice = new Device(req.body.device);
    console.log(req.body)
    await newDevice.save();
    res.redirect("/devices");
  } catch (err) {
    console.error(err);
    res.render("devices/new", { error: err.message, deviceTypes, deviceRoles, connectionTypes });
  }
});

/* READ */

// Show all devices
router.get("/", async (req, res) => {
  try {
    const systemSetting = await SystemSetting.findOne();

    const devices = await Device.find({});
    const user = await User.findById(req.user);

    res.render("devices/index", { devices,role: user.role ,systemSetting});
  } catch (err) {
    console.error(err);
    res.send("Error retrieving devices");
  }
});

// Show one device
router.get("/:id", async (req, res) => {
  try {
    const systemSetting = await SystemSetting.findOne();

    const device = await Device.findById(req.params.id);
    const user = await User.findById(req.user);

    res.render("devices/show", { device ,role: user.role,systemSetting});
  } catch (err) {
    console.error(err);
    res.send("Error retrieving device");
  }
});

/* UPDATE */

// Show form to edit device
router.get("/:id/edit", async (req, res) => {
  try {
    const systemSetting = await SystemSetting.findOne();

    const device = await Device.findById(req.params.id);
    const user = await User.findById(req.user);

    res.render("devices/edit", { device, deviceTypes, deviceRoles, connectionTypes,role: user.role,systemSetting });
  } catch (err) {
    console.error(err);
    res.send("Error retrieving device");
  }
});

// Update device in DB
router.post("/update", async (req, res) => {
  try {
    await Device.findByIdAndUpdate(req.body.id, req.body.device);
    res.redirect(`/devices/${req.body.id}`);
  } catch (err) {
    console.error(err);
    res.send("Error updating device");
  }
});

/* DELETE */

// Delete device from DB
router.delete("/:id", async (req, res) => {
  try {
    await Device.findByIdAndDelete(req.params.id);
    res.redirect("/devices");
  } catch (err) {
    console.error(err);
    res.send("Error deleting device");
  }
});

module.exports = router;

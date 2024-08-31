const Customer = require("../models/costemer");
const router = require("express").Router();

router.get("/getall", async (req, res) => {
  const custemer = await Customer.find();
  res.json(custemer);
});

router.get("/getbyname/:searchName", async (req, res) => {
  const searchName = req.params.searchName;
  try {
    const patients = await Customer.find({
      name: { $regex: searchName, $options: "i" },
    })
      .sort({ updatedAt: -1 }) // Sort by 'updatedAt' field in descending order
      .limit(10);
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




module.exports = router;

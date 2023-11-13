const router = require("express").Router();
const Category = require("../models/category");
const Food = require("../models/food");
const foodcontroll = require("../controllers/food.controll");
const multer = require("multer");
const fs = require("fs");

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
router.get("/", async (req, res) => {
  const category = await Category.find().populate("foods");
  console.log(category);
  res.render("food", { category });
});

router.patch("/:foodId/active/", async (req, res) => {
  try {
    const food = await Food.findById(req.params.foodId);
    food.active = !food.active;
    const newfood = await food.save();
    res.status(200).json({ active: newfood.active });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.get("/getall", async (req, res) => {
  try {
    const foods = await Food.find()
    res.json(foods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

});

router.post("/addcategory", async (req, res) => {
  const feedCategory = new Category({
    name: req.body.category,
  });
  try {
    const newfeedCategory = await feedCategory.save();
    res.status(201).redirect("/food");
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post("/getfooddata", async (req, res) => {
  try {
    const fooddata = await Food.findById(req.body.id);
    if (!fooddata) {
      return res.status(404).json({ message: "Food data not found" });
    }
    res.status(200).json(fooddata);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/editfood", upload.single("image"), async (req, res) => {
  try {
    let food = await Food.findById(req.body.foodid);
    console.log(req.body);
    food.name = req.body.name;
    food.barcode = req.body.barcode;
    food.price = parseInt(req.body.price.replace(/[^0-9]/g, ""));
    food.cost = parseInt(req.body.cost.replace(/[^0-9]/g, ""));
    food.quantety = req.body.quantety;
    food.unlimit = req.body.unlimitecheck;
    if (req.file) {
      // Delete the previous image if it exists
      if (food.image && food.image.length > 0) {
        const imagePath = "./public" + food.image[0].url;
        fs.unlink(imagePath, (err) => {
          if (err) console.error(err);
        });
      }
      console.log(req.file);
      // Add the new image to the project
      food.image.url = "/img/foodimg/" + req.file.filename;
    }

    await food.save();
    res.redirect("/food");
  } catch (err) {
    console.error(err);
    res.redirect("/food");
  }
});

router.delete("/:foodId/foodremove", async (req, res) => {
  // console.log(req.params.foodId)
  try {
    ids = JSON.parse(req.params.foodId);
    console.log(ids);
    const food = await Food.findById(ids.foodid);
    const updatedCatacory = await Category.findByIdAndUpdate(
      ids.categoryid,
      { $pull: { foods: ids.foodid } },
      { new: true }
    );
    if (!updatedCatacory) {
      return res
        .status(404)
        .json({ message: "categoryid or food item not found" });
    }

    // console.log(updatedInvoice)

    food.deleted = true;
    await food.save();
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.delete("/:catacotyid/removecatogary", async (req, res) => {
  try {
    const category = await Category.findByIdAndRemove(req.params.catacotyid);

    if (!category) {
      return res.status(404).send("Category not found");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.post("/addfood", upload.single("image"), async (req, res) => {
  try {
    const Categoryid = req.body.foodcategoryid;
    const barcode = req.body.barcode;
    const pricenum = parseInt(req.body.price.replace(/[^0-9]/g, ""));
    const costnum = parseInt(req.body.cost.replace(/[^0-9]/g, ""));
    const { name, unlimitecheck, quantety } = req.body;
    const imagePath = req.file ? "/img/foodimg/" + req.file.filename : null;
    console.log(imagePath);

    const food = new Food({
      name,
      price: pricenum,
      barcode: barcode,
      cost: costnum || 0,
      unlimit: unlimitecheck,
      image: { url: imagePath },
      quantety,
    });

    const newfood = await food.save();

    await Category.findByIdAndUpdate(
      Categoryid,
      { $push: { foods: newfood.id } },
      { new: true }
    );

    res.redirect("/food");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.post("/addpurchasesfood", upload.single("image"), async (req, res) => {
  try {
    const Categoryid = req.body.foodcategoryid;
    const barcode = req.body.barcode;
    const pricenum = parseInt(req.body.price.replace(/[^0-9]/g, ""));
    const costnum = parseInt(req.body.cost.replace(/[^0-9]/g, ""));
    const { name, unlimitecheck, quantety } = req.body;
    const imagePath = req.file ? "/img/foodimg/" + req.file.filename : null;
    console.log(imagePath);

    const food = new Food({
      name,
      price: pricenum,
      barcode: barcode,
      cost: costnum || 0,
      unlimit: unlimitecheck,
      image: { url: imagePath },
      quantety,
    });

    const newfood = await food.save();

    await Category.findByIdAndUpdate(
      Categoryid,
      { $push: { foods: newfood.id } },
      { new: true }
    );

    res.redirect("/purchases");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});


module.exports = router;

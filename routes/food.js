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

router.get("/", async (req, res) => {
  const systemSetting = await SystemSetting.findOne();

  const category = await Category.find().populate("foods");
  console.log(category);
  const user = await User.findById(req.user);
  const food = await Food.find({ deleted: false, unlimit: false });
  let totalCost = 0;
  food.forEach((item) => {
    console.log("item name", item.name);
    console.log("item cost", item.cost);
    console.log("item quantity", item.quantety);
    totalCost += Number(item.cost) * Number(item.quantety);
  });
  res.render("food", { category, role: user.role, systemSetting, totalCost });
});

router.get("/getall", async (req, res) => {
  const food = await Food.find({ deleted: false });
  console.log(food)
  res.json(food);
});

router.get("/categories", async (req, res) => {
  try {
    const systemSetting = await SystemSetting.findOne();
    const category = await Category.find().populate("foods");
    const user = await User.findById(req.user);
    const food = await Food.find({ deleted: false, unlimit: false });

    let totalCost = 0;
    food.forEach((item) => {
      totalCost += Number(item.cost) * Number(item.quantety);
    });

    res.json({ category, role: user.role, systemSetting, totalCost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
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
    const foods = await Food.find({ deleted: false })
      .sort({ name: 1 })
      .populate("category");
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
    food.unit = req.body.unit;
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
    console.log(req.params.foodId);
    const foodId = req.params.foodId;
    const food = await Food.findById(foodId);
    console.log(food)
    const updatedCatacory = await Category.findByIdAndUpdate(
      food.category,
      { $pull: { foods: foodId } },
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
    const deletedCategory = await Category.findById(req.params.catacotyid);

    deletedCategory.foods.forEach(async (item) => {
      const deletedFood = await Food.findById(item);
      deletedFood.deleted = true;
      await deletedFood.save();
    });
    if (!deletedCategory) {
      return res.status(404).send("Category not found");
    }
    const category = await Category.findByIdAndRemove(req.params.catacotyid);

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
    const unit = req.body.unit;
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
      unit: unit,
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

async function getSumOfQuantetyCost() {
  try {
    const result = await Food.aggregate([
      {
        $match: {
          deleted: false,
          unlimit: false,
        },
      },
      {
        $project: {
          quantety: { $toDouble: "$quantety" },
          cost: { $toDouble: "$cost" },
          totalCost: {
            $multiply: [{ $toDouble: "$quantety" }, { $toDouble: "$cost" }],
          },
        },
      },
      {
        $group: {
          _id: null,
          sumTotalCost: {
            $sum: "$totalCost",
          },
        },
      },
    ]);

    const sumTotalCost = result.length > 0 ? result[0].sumTotalCost : 0;
    console.log("Sum of quantety * cost:", sumTotalCost);
    return sumTotalCost;
  } catch (error) {
    console.error("Error calculating sum:", error);
    throw error;
  }
}

module.exports = router;

const express = require("express");
const path = require("path");

const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const app = express();
const port = process.env.PORT || 3000;
app.use(compression());
app.use(morgan("dev"));
const passport = require("passport");

require("dotenv").config();
require("./config/database");
require("./config/passport")(passport);

require("./models/user");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const paymentType = require("./models/paymentType");
const storge = require("./models/storge");
const systemSetting = require("./models/systemSetting");
const Food = require("./models/food");
const Category = require("./models/category");
const User = require("./models/user");

// const Visitor = require('./models/visitor');
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Use true if your server is running over HTTPS
    httpOnly: false, // Set to true if you don't need to access the cookie via JavaScript
    sameSite: 'Lax', // Adjust as needed ('Strict', 'Lax', 'None')
      },
}));

//use flash
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
// Middleware to check user's token expiry
const checkTokenExpiry = async (req, res, next) => {
  try {
    // Assuming req.user contains the user information from the session
    if (req.isAuthenticated() && req.user) {
      console.log("Checking token expiry...");

      const user = await User.findById(req.user._id); // Fetch user from DB
      console.log(user);
      console.log(req.user);
      console.log(user.expireDate);

      if (user && user.expireDate && user.expireDate < Date.now()) {
        return res.status(403).send("Your token has expired. Please request a new token to continue.");
      }
    }
    next(); // Proceed if user is authenticated and token is valid
  } catch (err) {
    console.error("Error checking token expiry:", err);
    res.status(500).send("An error occurred while checking token expiry.");
  }
};

// Apply the middleware globally, so all routes are protected
app.use(checkTokenExpiry);

// CORS Configuration
app.use(cors({
  origin: true, // Reflects the request origin, allowing all origins
  credentials: true, // Allows cookies to be sent and received
}));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

const defaultPayment = [{ name: "نقدي" }, { name: "اجل" }];

async function updateFoodCategories() {
  try {
    // Connect to MongoDB

    // Get all food items that do not have a category
    const foodsWithoutCategory = await Food.find({ category: { $exists: false } });
    console.log(foodsWithoutCategory);
    if (foodsWithoutCategory.length === 0) {
      console.log("No foods without a category found.");
      return;
    }

    // Get all categories
    const categories = await Category.find().populate("foods");

    for (const food of foodsWithoutCategory) {
      let categoryFound = false;

      for (const category of categories) {
        // Check if this category contains the food
        if (category.foods.some(f => f.equals(food._id))) {
          // Update the food with the category ID
          await Food.findByIdAndUpdate(food._id, { category: category._id });
          console.log(`Updated food ${food.name} with category ${category.name}`);
          categoryFound = true;
          break; // Break the inner loop once the category is found
        }
      }

      // If no category was found for the food, mark it as deleted
      if (!categoryFound) {
        await Food.findByIdAndUpdate(food._id, { unlimit: true });
        console.log(`Marked food ${food.name} as deleted.`);
      }
    }

    console.log("Finished updating food categories.");
  } catch (error) {
    console.error("Error updating food categories:", error);
  }
}

updateFoodCategories();

paymentType
  .countDocuments()
  .then((count) => {
    if (count === 0) {
      // Create default documents using a forEach loop
      defaultPayment.forEach((customerItem, index) => {
        const defaultpaymentType = new paymentType(customerItem);
        defaultpaymentType
          .save()
          .then(() => {
            console.log(`defaultpaymentType ${index + 1} created.`);
          })
          .catch((err) => {
            console.error(
              `Error creating defaultpaymentType ${index + 1}:`,
              err
            );
          });
      });
    }
  })
  .catch((err) => {
    console.error("Error checking Customer collection:", err);
  });

const defaultStorges = [{ name: "معدات" }, { name: "منتجات" }];
storge
  .countDocuments()
  .then((count) => {
    if (count === 0) {
      // Create default documents using a forEach loop
      defaultStorges.forEach((customerItem, index) => {
        const defaultStorge = new storge(customerItem);
        defaultStorge
          .save()
          .then(() => {
            console.log(`defaultStorge ${index + 1} created.`);
          })
          .catch((err) => {
            console.error(`Error creating defaultStorge ${index + 1}:`, err);
          });
      });
    }
  })
  .catch((err) => {
    console.error("Error checking Customer collection:", err);
  });

systemSetting.countDocuments()
  .then((count) => {
    if (count === 0) {
      // Create default documents using a forEach loop
      const defaultStorge = new systemSetting();
      defaultStorge
        .save()
        .then(() => {
          console.log(`defaultSitting created.`);
        })
        .catch((err) => {
          console.error(`Error creating defaultStorge :`, err);
        });
    }
  })
  .catch((err) => {
    console.error("Error checking Customer collection:", err);
  });

app.use(require("./routes"));

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

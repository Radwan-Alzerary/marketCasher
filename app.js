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
const http = require('http');

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
const socketIo = require('socket.io');
const Table = require("./models/table");
const Invoice = require("./models/invoice");

// const Visitor = require('./models/visitor');
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: false,
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
// Create an HTTP server
const server = http.createServer(app);
// Pass `io` to the invoice router
app.use((req, res, next) => {
  req.io = io;
  next();
});

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
// Initialize Socket.IO
const io = socketIo(server);

// Handle socket connections
io.on('connection', (socket) => {
  console.log('New customer connected:', socket.id);

  socket.on("addFoodToInvoice", async ({ tableId, foodId, invoiceId }) => {
    try {
      console.log("zzaa")
      let existingFoodcheck = 0;
      const table = await Table.findById(tableId);

      if (!table) {
        return socket.emit("error", { error: "Table not found" });
      }

      let invoice;
      if (!invoiceId) {
        // If no invoiceId is provided, check if the table has an invoice
        const lastInvoice = await Invoice.findOne().sort({ number: -1 });
        let invoiceNumber = lastInvoice ? lastInvoice.number + 1 : 1;

        if (table.invoice.length === 0) {
          const newPaymentType = await paymentType.findOne({ name: "نقدي" });

          // If the table does not have an invoice, create a new one
          invoice = new Invoice({
            number: invoiceNumber,
            paymentType: newPaymentType.id,
            type: "قيد المعالجة", // Set invoice type
            active: true,
          });
          await invoice.save();
          table.invoice.push(invoice._id);
          await table.save();
        } else {
          // Use existing invoice
          invoice = await Invoice.findById(table.invoice[0]);
          if (!invoice) {
            return socket.emit("error", { error: "Invoice not found" });
          }
        }
      } else {
        invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
          return socket.emit("error", { error: "Invoice not found" });
        }
      }

      let updatedfoodid = "";
      // Check if food already exists in the invoice
      const existingFood = invoice.dummyFood.find(
        (item) => item.id.toString() === foodId
      );
      if (existingFood) {
        const foodData = await Food.findById(existingFood.id);
        updatedfoodid = foodData.id;
        existingFoodcheck = 1;
        // Increment quantity if food exists
        existingFood.quantity += 1;
        await Food.findByIdAndUpdate(existingFood.id, {
          quantety: foodData.quantety - 1,
        });
      } else {
        // If food doesn't exist, add it to the invoice
        const food = await Food.findById(foodId);
        if (!food) {
          return socket.emit("error", { error: "Food not found" });
        }
        await Food.findByIdAndUpdate(foodId, { quantety: food.quantety - 1 });

        const newFood = {
          id: food._id,
          quantity: 1,
          discount: 0,
          foodCost: food.cost,
          foodPrice: food.price,
        };
        food.quantety -= 1;
        await food.save();

        invoice.dummyFood.push(newFood);
      }

      await invoice.save();

      // Get the last added food from the invoice
      const lastAddedFood = invoice.dummyFood[invoice.dummyFood.length - 1].id;
      const populatedFood = await Food.findById(lastAddedFood);
      const editOneFood = await Food.findById(foodId);

      if (existingFoodcheck) {
        socket.emit("foodUpdated", {
          message: "alredyadd",
          food: populatedFood,
          editOneFood,
          newquantity: existingFood.quantity,
          invoiceId: invoice.id,
          foodPrice: existingFood.foodPrice,
          updatedfoodid: updatedfoodid,
        });
      } else {
        socket.emit("foodAdded", {
          message: "Food added to the invoice successfully",
          food: populatedFood,
          editOneFood,
          invoiceId: invoice.id,
          newquantity: 1,
          foodPrice: populatedFood.price,
        });
      }
    } catch (err) {
      console.error(err);
      socket.emit("error", { error: "Server error" });
    }
  });




  // Listen for messages from a customer
  socket.on('message', (message) => {
    console.log('Received message:', message);

    // Broadcast the message to all connected customers
    io.emit('message', message);
  });

  // Handle customer disconnection
  socket.on('disconnect', () => {
    console.log('Customer disconnected:', socket.id);
  });
});
async function updateInvoices() {
  try {
    // Find all active invoices that are not deleted and not returned
    const invoices = await Invoice.find({
      deleted: false,
      isReturned: false,
      type: "قيد المعالجة"
    }).populate('food.id'); // Populate to get 'unit' and 'price'
    console.log(invoices)
    for (const invoice of invoices) {
      let invoiceUpdated = false;

      for (const foodItem of invoice.food) {
        const food = foodItem.id;

        if (food.unit === 'ساعة' && foodItem.addTime) {
          console.log('Processing food item:', food.name);

          // Calculate the time difference in minutes
          const timeDiffInMinutes = (Date.now() - new Date(foodItem.addTime)) / (1000 * 60);

          // Calculate price and cost per minute
          const pricePerMinute = foodItem.id.price / 60;
          const costPerMinute = foodItem.id.cost / 60;

          // Calculate total price and total cost based on time difference
          foodItem.foodPrice = pricePerMinute * timeDiffInMinutes * foodItem.quantity;
          foodItem.foodCost = costPerMinute * timeDiffInMinutes * foodItem.quantity;

          invoiceUpdated = true;
        }
      }

      if (invoiceUpdated) {
        // Recalculate foodcost and finalcost
        invoice.foodcost = invoice.food.reduce((total, item) => total + item.foodCost, 0);
        invoice.finalcost = invoice.food.reduce((total, item) => total + item.foodPrice, 0);

        await invoice.save();
      }
    }
    io.emit("message", "refresh");

  } catch (error) {
    console.error('Error updating invoices:', error);
  }
}

// Set interval to run every minute (60000 milliseconds)
setInterval(() => updateInvoices(io), 60000);



// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

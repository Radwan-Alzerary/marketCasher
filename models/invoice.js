const mongoose = require("mongoose");
const Counter = require("./CounterSchema"); // Import the Counter model
const { comment } = require("postcss");

const InvoiceSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      required: true,
    },
    dailyNumber: {
      type: Number,
    },

    type: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    active: { type: Boolean },
    deleted: { type: Boolean, default: false },
    foodcost: { type: Number },
    fullcost: { type: Number },
    fulldiscont: { type: Number },
    finalcost: { type: Number },
    amountReceived: { type: Number, default: 0 },
    deleveryadress: { type: String },
    resivename: { type: String },
    tableid: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
    food: [
      {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
        quantity: { type: Number },
        foodCost: { type: Number },
        foodPrice: { type: Number },
        discount: { type: Number },
        discountType: { type: String },
        resturentPrint: { type: Boolean, default: false },
        printCount: { type: Number, default: 0 },
        isReturned: { type: Boolean, default: false }, // New field to track returned status of food items
        returnQuantity: { type: Number, default: 0 }, // Quantity returned
        addTime: { type: Date },
        comment: { type: String }, // Comment for the food item
      },
    ],
    dummyFood: [{
      id: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
      quantity: { type: Number },
      foodCost: { type: Number },
      foodPrice: { type: Number },
      discount: { type: Number },
      discountType: { type: String },
      comment: { type: String }, // Comment for the food item

    }],
    isReturned: { type: Boolean, default: false }, // New field to track full return status
    returnReason: { type: String }, // Reason for return

    systemdiscounts: { type: Number },
    discount: { type: Number },
    deleveryCost: { type: Number, default: 0 },
    progressdata: { type: Date },
    paymentType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "paymentType",
    },
  },
  {
    timestamps: true,
  }
);
// Middleware to set the dailyNumber only when creating a new invoice
InvoiceSchema.pre("save", async function (next) {
  // Check if the document is new (i.e., it is being created for the first time)
  const currentDate = new Date();

  currentDate.setHours(currentDate.getHours() + 3); // Adjust to UTC+03:00

  // Set the progressdata field to the current date and time in UTC+03:00
  this.progressdata = currentDate;

  if (!this.isNew) {
    return next(); // If not new, do not update dailyNumber
  }

  const formattedDate = currentDate.toISOString().split("T")[0]; // 'YYYY-MM-DD'


  try {
    // Check for an existing counter document for today's date
    let counter = await Counter.findOne({ date: formattedDate });

    if (!counter) {
      // If not found, create a new counter for today and set count to 1
      counter = new Counter({ date: formattedDate, count: 1 });
      await counter.save();
      this.dailyNumber = 1;
    } else {
      // If found, increment the count by 1
      counter.count += 1;
      await counter.save();
      this.dailyNumber = counter.count;
    }

    next();
  } catch (error) {
    next(error);
  }
});


// Method to return a specific food item
InvoiceSchema.methods.returnFoodItem = async function (foodItemId, returnQuantity, reason) {
  const foodItem = this.food.find((item) => item.id.toString() === foodItemId.toString());


  if (returnQuantity > foodItem.quantity) {
    throw new Error("Return quantity exceeds original quantity.");
  }

  foodItem.isReturned = true;
  foodItem.returnQuantity = returnQuantity + foodItem.returnQuantity;
  foodItem.quantity -= returnQuantity;
  this.foodcost -= foodItem.foodCost * returnQuantity;
  this.finalcost -= foodItem.foodPrice * returnQuantity;

  // Update the return reason if provided
  this.returnReason = reason || this.returnReason;

  return this.save();
};

// Method to return the entire invoice
InvoiceSchema.methods.returnFullInvoice = async function (reason) {
  if (this.isReturned) {
    throw new Error("Invoice already returned.");
  }

  this.isReturned = true;
  this.type = "راجع";

  this.food.forEach((item) => {
    item.isReturned = true;
    item.returnQuantity = item.quantity;
    item.quantity = 0;
  });

  // Set all costs to zero or perform refund calculation as needed
  this.returnReason = reason;

  return this.save();
};


const invoice = mongoose.model("Invoice", InvoiceSchema);

module.exports = invoice;

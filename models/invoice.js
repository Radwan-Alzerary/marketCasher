const mongoose = require("mongoose");
const Counter = require("./CounterSchema"); // Import the Counter model

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
        printCount: { type: Number,default:0 }
      },
    ],
    dummyFood: [{
      id: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
      quantity: { type: Number },
      foodCost: { type: Number },
      foodPrice: { type: Number },
      discount: { type: Number },
      discountType: { type: String },

    }],
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
  if (!this.isNew) {
    return next(); // If not new, do not update dailyNumber
  }

  const currentDate = new Date();
  currentDate.setHours(currentDate.getHours() + 3); // Adjust to UTC+03:00
  const formattedDate = currentDate.toISOString().split("T")[0]; // 'YYYY-MM-DD'

  // Set the progressdata field to the current date and time in UTC+03:00
  this.progressdata = currentDate;

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

const invoice = mongoose.model("Invoice", InvoiceSchema);

module.exports = invoice;

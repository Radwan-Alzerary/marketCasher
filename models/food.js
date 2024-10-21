const mongoose = require("mongoose");

const FoodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      url: { type: String },
    },
    active: {
      type: Boolean,
      default: true,
    },
    manualBarcode: { type: String },
    unit: { type: String, default: "" },
    unlimit: {
      type: Boolean,
      default: true,
    },
    quantety: {
      type: Number,
      default: 0,
    },
    barcode: { type: String },
    addeduse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    cost: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    storge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "storge",
    },
    expireDate: {
      type: Date,
    },
    printable: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
  }
);

// Utility function to generate a random string
function generateRandomBarcode(length = 8) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Pre-save middleware to generate the manualBarcode if it doesn't exist
FoodSchema.pre("save", async function (next) {
  const food = this;

  if (!food.manualBarcode) {
    let newBarcode = food.barcode || generateRandomBarcode();

    // Check if the generated or barcode already exists
    let existingProduct = await mongoose.model("Food").findOne({
      manualBarcode: newBarcode,
    });

    // Generate a random barcode if it already exists
    while (existingProduct) {
      newBarcode = generateRandomBarcode();
      existingProduct = await mongoose.model("Food").findOne({
        manualBarcode: newBarcode,
      });
    }

    food.manualBarcode = newBarcode;
  }

  next();
});



const Food = mongoose.model("Food", FoodSchema);

module.exports = Food;

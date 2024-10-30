const mongoose = require("mongoose");
const TableSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    book: {
      state: { type: Boolean, default: false },
      startBookedDate: { type: Date },
      bookedEndDate: { type: Date },
    },
    Families:{type:Boolean,default:false},
    iconChange:{type:Boolean,default:false}, 
    nameChange:{type:Boolean,default:false},
    colorChange:{type:Boolean,default:false},
    name:{type:String,default:""},
    icon:{type:String,default:""},
    color:{type:String,default:""},
    invoice: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice",
      },
    ],
    lastinvoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
  },
  {
    timestamps: true,
  }
);
const Table = mongoose.model("Table", TableSchema);

module.exports = Table;

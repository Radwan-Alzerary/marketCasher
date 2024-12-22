// models/Devices.js

const mongoose = require("mongoose");

const deviceTypes = ["A4 Printer", "Thermal Printer"];
const deviceRoles = ["كاشير", "دلفري", "مطبخ", "عوائل", "شباب", "نداء اول", "نداء ثاني"];
const connectionTypes = ["USB", "Ethernet", "Wi-Fi","interface"];

const DevicesSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: deviceTypes,
      required: true,
    },
    role: [
      {
        type: String,
        enum: deviceRoles,
        // required: true,
      },
    ],
    secenderyRole: [
      {
        type: String,
        enum: deviceRoles,
        // required: true,
      },
    ],
    onlineSync: {
      isOnlineSync: {
          type: Boolean,
          default: false,
      },
      OnlineSyncDate: {
          type: Date,
      },
  },

    categoryRole: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    computerId: { type: String }, // Link to the computer

    reportPrinter: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    printLogo: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    openCashdraw: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    ip: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(v);
        },
        message: (props) => `${props.value} is not a valid IP address!`,
      },
    },
    connectionType: {
      type: String,
      enum: connectionTypes,
      required: true,
    },
    numberOfPrint: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    location: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Devices = mongoose.model("Devices", DevicesSchema);

module.exports = Devices;

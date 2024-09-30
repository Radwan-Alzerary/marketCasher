// models/Devices.js

const mongoose = require("mongoose");

const deviceTypes = ["A4 Printer", "Thermal Printer"];
const deviceRoles = ["كاشير", "دلفري", "مطبخ", "نداء اول", "نداء ثاني"];
const connectionTypes = ["USB", "Ethernet", "Wi-Fi"];

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
        required: true,
      },
    ],
    secenderyRole: [
      {
        type: String,
        enum: deviceRoles,
        required: true,
      },
    ],

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

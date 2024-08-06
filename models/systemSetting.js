const mongoose = require("mongoose");
const systemSettingSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      default: "casher",
    },
    license: {
      type: String,
    },
    
  },
  {
    timestamps: true,
  }
);
const systemSetting = mongoose.model("systemSetting", systemSettingSchema);

module.exports = systemSetting;

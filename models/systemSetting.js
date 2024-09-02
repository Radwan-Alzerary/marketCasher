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
    telegramBotId: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);
const systemSetting = mongoose.model("systemSetting", systemSettingSchema);

module.exports = systemSetting;

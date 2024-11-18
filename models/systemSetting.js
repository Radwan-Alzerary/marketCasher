const mongoose = require("mongoose");

// Generate a 6-character alphanumeric special ID
function generateSpecialId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let specialId = '';
  for (let i = 0; i < 6; i++) {
    specialId += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return specialId;
}

const systemSettingSchema = new mongoose.Schema(
  {
    specialId: {
      type: String,
      required: true,
      unique: true,
      default: generateSpecialId,
      match: /^[A-Z0-9]{6}$/, // Ensures only 6 uppercase alphanumeric characters
    },
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
    onlineSync: {
      isOnlineSync: {
        type: Boolean,
        default: false,
      },
      OnlineSyncDate: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

const SystemSetting = mongoose.model("systemSetting", systemSettingSchema);

module.exports = SystemSetting;

// Initialization function to check for an existing document and create one if none exists
async function initializeSystemSetting(customSpecialId = generateSpecialId()) {
  try {
    // Check if any systemSetting document exists
    const existingSetting = await SystemSetting.findOne();
    if (!existingSetting) {
      console.log("No systemSetting found, creating a new one...");
      
      // Create a new systemSetting document with a custom special ID if provided
      const newSetting = new SystemSetting({ specialId: customSpecialId });
      await newSetting.save();
      
      console.log("New systemSetting created:", newSetting);
    } else {
      console.log("Existing systemSetting found:", existingSetting);
    }
  } catch (error) {
    console.error("Error initializing systemSetting:", error);
  }
}

// Call the function when the app starts
initializeSystemSetting();

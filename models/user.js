const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  expireDate: {
    type: Date,
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
computerId: { type: String }, // Link to the computer

  role: { type: String, defult: "user" },
  date: {
    type: Date,
    default: Date.now,
  },
  internetId: {
    type: String,
  },
});
const User = mongoose.model("User", UserSchema);

module.exports = User;

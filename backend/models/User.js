const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,

  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  position: {
    type: String,
    enum: ["left", "right"],
    default: null
  },

  leftChild: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  rightChild: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

});

module.exports = mongoose.model("User", userSchema);
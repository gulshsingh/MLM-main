const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// SIGNUP
const mongoose = require("mongoose");

exports.signup = async (req, res) => {
  try {

    const { name, email, password, parentId, position } = req.body;

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      position
    });

    // parentId tabhi set karo jab valid ho
    if (parentId && mongoose.Types.ObjectId.isValid(parentId)) {
      user.parentId = parentId;
    }

    await user.save();

    // Parent update
    if (parentId && mongoose.Types.ObjectId.isValid(parentId)) {

      const parent = await User.findById(parentId);

      if (!parent) {
        return res.status(404).json({ message: "Parent not found" });
      }

      if (position === "left") {

        if (parent.leftChild) {
          return res.status(400).json({ message: "Left already filled" });
        }

        parent.leftChild = user._id;

      } else if (position === "right") {

        if (parent.rightChild) {
          return res.status(400).json({ message: "Right already filled" });
        }

        parent.rightChild = user._id;
      }

      await parent.save();
    }

    res.status(201).json({
      message: "User created successfully",
      user
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }
};


// LOGIN
exports.login = async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }

};


exports.getLevelUsers = async (req, res) => {

  try {

    const { userId } = req.params;

    const queue = [userId];
    const levels = [];

    while (queue.length > 0) {

      const size = queue.length;
      const level = [];

      for (let i = 0; i < size; i++) {

        const id = queue.shift();

        const user = await User.findById(id);

        if (!user) continue;

        level.push(user);

        if (user.leftChild) queue.push(user.leftChild);
        if (user.rightChild) queue.push(user.rightChild);

      }

      levels.push(level);
    }

    res.json(levels);

  } catch (error) {
    res.status(500).json(error);
  }

};




exports.getTree = async (req, res) => {

  try {

    const buildTree = async (userId) => {

      const user = await User.findById(userId);

      if (!user) return null;

      return {
        id: user._id,
        name: user.name,

        left: user.leftChild
          ? await buildTree(user.leftChild)
          : null,

        right: user.rightChild
          ? await buildTree(user.rightChild)
          : null
      };

    };

    const tree = await buildTree(req.params.userId);

    res.json(tree);

  } catch (error) {
    res.status(500).json(error);
  }

};
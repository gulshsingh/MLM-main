require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");

const app = express();

// middleware
app.use(express.json());

// database connect
connectDB();

app.get("/", (req, res) => {
  res.send("Binary MLM API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
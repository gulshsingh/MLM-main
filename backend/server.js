require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/users", require("./routes/userRoutes"));

app.get("/", (req, res) => {
  res.send("Binary MLM API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
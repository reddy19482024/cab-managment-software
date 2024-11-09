const express = require("express");
const connectDB = require("./config/db");
const dynamicRoutes = require("./routes/dynamicRoutes");
const authRoutes = require("./routes/authRoutes");
const dotenv = require("dotenv");
const authMiddleware = require("./middlewares/authMiddleware");

dotenv.config();
const app = express();

connectDB();
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", authMiddleware, dynamicRoutes);

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});

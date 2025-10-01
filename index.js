const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cartRoutes = require("./routes/cartRoutes");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const app = express();
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => res.send("Food Delivery API Running 🚀"));
app.get("/health", (req, res) => res.json({ status: "OK", timestamp: new Date() }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/foodItems", require("./routes/foodItemRoutes"));
app.use("/api/cart", cartRoutes);
app.use("/api/orders", require("./routes/orderRoutes"));


const PORT = process.env.PORT || 5005;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
   
    app.listen(PORT, '0.0.0.0', () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:");
    console.error(err.message);
    process.exit(1);
  });

// const express = require("express");
// const cors = require("cors");
// const mongoose = require("mongoose");
// const cartRoutes = require("./routes/cartRoutes");
// require("dotenv").config();
// const cookieParser = require("cookie-parser");
// const app = express();
// app.use(cookieParser());

// // ✅ CORS setup to allow cookies from frontend
// app.use(
//   cors({
//     origin: "http://localhost:5173", // your frontend
//     credentials: true, // allow sending cookies
//   })
// );

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Routes
// app.get("/", (req, res) => res.send("API Running "));
// app.use("/api/auth", require("./routes/authRoutes"));
// app.use("/api/foodItems", require("./routes/foodItemRoutes"));
// app.use("/api/cart", cartRoutes);
// app.use("/api/orders", require("./routes/orderRoutes"));

// // MongoDB and server start
// const PORT = process.env.PORT || 5005;
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log("✅ MongoDB connected successfully");
//     app.listen(PORT, () =>
//       console.log(`🚀 Server running on http://localhost:${PORT}`)
//     );
//   })
//   .catch((err) => {
//     console.error("❌ MongoDB connection error:");
//     console.error(err.message);
//     process.exit(1);
//   });

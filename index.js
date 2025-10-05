const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cartRoutes = require("./routes/cartRoutes");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const app = express();

app.use(cookieParser());

// Allow localhost and all Vercel deployments
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://food-delivery-frontend-beta-six.vercel.app"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow Vercel preview deployments in development/staging
    if (process.env.ALLOW_VERCEL_PREVIEWS === 'true' && origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    console.error(`CORS blocked: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
}));

// app.use(cors({
//   origin: function(origin, callback) {
//     // Allow requests with no origin (Postman, mobile apps)
//     if (!origin) return callback(null, true);
    
//     // Check if origin is in allowed list
//     if (allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     }
    
//     // Allow ALL Vercel preview deployments (*.vercel.app)
//     if (origin.endsWith('.vercel.app')) {
//       return callback(null, true);
//     }
    
//     console.error(`CORS blocked: ${origin}`);
//     callback(new Error('Not allowed by CORS'));
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   exposedHeaders: ['set-cookie']
// }));

// Handle preflight requests


app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => res.send("Food Delivery API Running"));
app.get("/health", (req, res) => res.json({ status: "OK", timestamp: new Date() }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/foodItems", require("./routes/foodItemRoutes"));
app.use("/api/cart", cartRoutes);
app.use("/api/orders", require("./routes/orderRoutes"));

const PORT = process.env.PORT || 10000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
    app.listen(PORT, '0.0.0.0', () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
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

// // // ✅ CORS Configuration
// // const allowedOrigins = [
// //   "http://localhost:5173",
// //   "https://food-delivery-frontend-beta-six.vercel.app"
// // ];

// // // app.use(cors({
// // //   origin: allowedOrigins,
// // //   credentials: true,
// // //   methods: ['GET', 'POST', 'PUT', 'DELETE'],
// // //   allowedHeaders: ['Content-Type', 'Authorization']
// // // }));

// // app.use(cors({
// //   origin: function(origin, callback) {
// //     // Allow requests with no origin (mobile apps, Postman, etc.)
// //     if (!origin) return callback(null, true);
    
// //     if (allowedOrigins.indexOf(origin) !== -1) {
// //       callback(null, true);
// //     } else {
// //       callback(new Error('Not allowed by CORS'));
// //     }
// //   },
// //   credentials: true,
// //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
// //   allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
// //   exposedHeaders: ['Set-Cookie']
// // }));

// const allowedOrigins = [
//   "http://localhost:5173",
//   "https://food-delivery-frontend-beta-six.vercel.app"
// ];

// app.use(cors({
//   origin: (origin, callback) => {
//     // Allow requests with no origin (like Postman, mobile apps)
//     if (!origin) return callback(null, true);

//     if (allowedOrigins.some(o => origin.startsWith(o))) {
//       callback(null, true);
//     } else {
//       console.error(`❌ CORS blocked: ${origin}`);
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
//   exposedHeaders: ["Set-Cookie"]
// }));


// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Routes
// app.get("/", (req, res) => res.send("Food Delivery API Running 🚀"));
// app.get("/health", (req, res) => res.json({ status: "OK", timestamp: new Date() }));

// app.use("/api/auth", require("./routes/authRoutes"));
// app.use("/api/foodItems", require("./routes/foodItemRoutes"));
// app.use("/api/cart", cartRoutes);
// app.use("/api/orders", require("./routes/orderRoutes"));

// // MongoDB and server start
// // const PORT = process.env.PORT || 5005;
// const PORT = process.env.PORT || 10000; 
// // app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));


// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log("✅ MongoDB connected successfully");
//     app.listen(PORT, '0.0.0.0', () =>
//       console.log(`🚀 Server running on port ${PORT}`)
//     );
//   })
//   .catch((err) => {
//     console.error("❌ MongoDB connection error:");
//     console.error(err.message);
//     process.exit(1);
//   });
  
// // const express = require("express");
// // const cors = require("cors");
// // const mongoose = require("mongoose");
// // const cartRoutes = require("./routes/cartRoutes");
// // require("dotenv").config();
// // const cookieParser = require("cookie-parser");
// // const app = express();
// // app.use(cookieParser());

// // // app.use(
// // //   cors({
// // //     origin: process.env.FRONTEND_URL || "http://localhost:5173",
// // //     credentials: true,
// // //   })
// // // );

// // const allowedOrigins = [
// //   "http://localhost:5173",
// //   "https://food-delivery-frontend-beta-six.vercel.app"
// // ];
// // app.use(cors({
// //   origin: "https://food-delivery-frontend-beta-six.vercel.app",
// //   credentials: true,
// //   methods: ['GET', 'POST', 'PUT', 'DELETE'],
// //   allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
// // }));

// // // app.use(cors({
// // //   origin: function (origin, callback) {
// // //     if (!origin || allowedOrigins.includes(origin)) {
// // //       callback(null, true);
// // //     } else {
// // //       callback(new Error("Not allowed by CORS"));
// // //     }
// // //   },
// // //   credentials: true
// // // }));


// // // Middleware
// // app.use(express.json());
// // app.use(express.urlencoded({ extended: true }));

// // // Routes
// // app.get("/", (req, res) => res.send("Food Delivery API Running 🚀"));
// // app.get("/health", (req, res) => res.json({ status: "OK", timestamp: new Date() }));

// // app.use("/api/auth", require("./routes/authRoutes"));
// // app.use("/api/foodItems", require("./routes/foodItemRoutes"));
// // app.use("/api/cart", cartRoutes);
// // app.use("/api/orders", require("./routes/orderRoutes"));

// // res.cookie('token', token, {
// //   httpOnly: true,
// //   secure: true, // HTTPS only
// //   sameSite: 'none', // Required for cross-site
// //   maxAge: 24 * 60 * 60 * 1000 // 1 day
// // });
// // const PORT = process.env.PORT || 5005;

// // mongoose
// //   .connect(process.env.MONGO_URI)
// //   .then(() => {
// //     console.log("✅ MongoDB connected successfully");
   
// //     app.listen(PORT, '0.0.0.0', () =>
// //       console.log(`🚀 Server running on port ${PORT}`)
// //     );
// //   })
// //   .catch((err) => {
// //     console.error("❌ MongoDB connection error:");
// //     console.error(err.message);
// //     process.exit(1);
// //   });


const express = require("express");
const multer = require("multer");
const {
  createFoodItem,
  getAllFoodItems,
  getFoodItemById,
  updateFoodItem,
  deleteFoodItem,
} = require("../controllers/foodItemcontroller");
const { adminAuthorization } = require("../middlewares/AdminAuthorization");

// Memory storage configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  }
}).fields([{ name: "images", maxCount: 5 }]);

const foodItemRouter = express.Router();

// Routes
foodItemRouter.post("/add", adminAuthorization, upload, createFoodItem);
foodItemRouter.get("/", getAllFoodItems);
foodItemRouter.get("/:id", getFoodItemById);
foodItemRouter.put("/:id", adminAuthorization, upload, updateFoodItem);
foodItemRouter.delete("/:id", adminAuthorization, deleteFoodItem);

module.exports = foodItemRouter;


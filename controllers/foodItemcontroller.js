const FoodItemModel = require("../models/foodItem.model");
const mongoose = require("mongoose");

const cloudinary = require("../utils/cloudinary");

const createFoodItem = async (req, res) => {  
  try {
    console.log("🍽️ Starting createFoodItem...");
    
    const images = req.files?.images || [];

    if (images.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "At least one image is required" });
    }

    console.log(`📸 Processing ${images.length} images...`);

    // Upload to Cloudinary using buffer
    const fileUpload = [];

    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      console.log(`📤 Uploading image ${i + 1}: ${file.originalname}`);
      
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "food_items",
              resource_type: "auto",
            },
            (error, result) => {
              if (error) {
                console.error(`❌ Cloudinary error for ${file.originalname}:`, error);
                reject(error);
              } else {
                console.log(`✅ Upload successful: ${result.public_id}`);
                resolve(result);
              }
            }
          );
          
          // End the stream with the file buffer
          uploadStream.end(file.buffer);
        });

        fileUpload.push({
          public_id: result.public_id,
          url: result.secure_url,
          name: file.originalname,
        });
        
      } catch (uploadError) {
        console.error(`❌ Failed to upload ${file.originalname}:`, uploadError);
        throw uploadError;
      }
    }

    console.log("✅ All images uploaded successfully");

    const newFood = await FoodItemModel.create({
      ...req.body,
      images: fileUpload,
    });

    console.log("✅ Food item created:", newFood._id);

    res.status(201).json({ success: true, data: newFood });
  } catch (error) {
    console.error("❌ Create Food Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

const updateFoodItem = async (req, res) => {
  try {
    console.log("🔄 Starting updateFoodItem for ID:", req.params.id);
    let updatedImages = [];

    
    if (req.body.existingImages) {
      try {
        updatedImages = JSON.parse(req.body.existingImages);
        console.log(`📸 Retaining ${updatedImages.length} existing images`);
      } catch (parseError) {
        console.error("Error parsing existing images:", parseError);
        updatedImages = [];
      }
    }

    // ✅ Upload new images if available
    if (req.files && req.files.images) {
      const files = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];

      console.log(`📤 Uploading ${files.length} new images...`);

      for (const file of files) {
        try {
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                folder: "food_items",
                resource_type: "auto",
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(file.buffer);
          });

          updatedImages.push({
            url: result.secure_url,
            public_id: result.public_id,
          });
          
          console.log(`✅ New image uploaded: ${result.public_id}`);
        } catch (uploadError) {
          console.error("Error uploading new image:", uploadError);
          throw uploadError;
        }
      }
    }

    console.log(`📸 Total images for update: ${updatedImages.length}`);

    // ✅ Update food item in DB
    const updatedFood = await FoodItemModel.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        price: req.body.price,
        category: req.body.category,
        description: req.body.description,
        available: req.body.available === "true",
        images: updatedImages,
      },
      { new: true, runValidators: true }
    );

    if (!updatedFood) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    console.log("✅ Food item updated successfully");

    return res.status(200).json({
      success: true,
      message: "Food item updated successfully",
      data: updatedFood,
    });
  } catch (error) {
    console.error("❌ Update Food Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update food item",
      error: error.message,
    });
  }
};

const getAllFoodItems = async (req, res) => {
  try {
    const {
      category,
      search,
      popular,
      page = 1,
      limit = 8,
      sort = "dateAdded",
      order = "desc",
    } = req.query;

    const filter = { available: true };

    if (category && category !== "all") {
      filter.category = category;
    }

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (popular === "true") {
      filter.isPopular = true;
    }

    const skip = (page - 1) * limit;
    const sortOrder = order === "asc" ? 1 : -1;

    const [foodItems, total] = await Promise.all([
      FoodItemModel.find(filter)
        .sort({ [sort]: sortOrder })
        .skip(Number(skip))
        .limit(Number(limit))
        .lean(),
      FoodItemModel.countDocuments(filter),
    ]);

    res.status(200).json({
      status: true,
      message: "Food items retrieved successfully",
      count: foodItems.length,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      foodItems,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message || "Database operation failed",
    });
  }
};

const getFoodItemById = async (req, res) => {
  try {
    const foodItem = await FoodItemModel.findById(req.params.id);

    if (!foodItem) {
      return res.status(404).send({
        status: false,
        message: "Food item not found",
      });
    }

    res.status(200).send({
      status: true,
      message: "Food item retrieved successfully",
      foodItem,
    });
  } catch (err) {
    console.error("Error fetching food item:", err);
    res.status(500).send({
      status: false,
      message: "Something went wrong. Unable to fetch food item.",
    });
  }
};

const deleteFoodItem = async (req, res) => {
  try {
    const foodItem = await FoodItemModel.findById(req.params.id);
    if (!foodItem) return res.status(404).json({ error: "Not found" });

    // Delete Cloudinary images using public_id
    console.log(`🗑️ Deleting ${foodItem.images.length} images from Cloudinary...`);
    for (const image of foodItem.images) {
      if (image.public_id) {
        try {
          await cloudinary.uploader.destroy(image.public_id);
          console.log(`✅ Deleted image: ${image.public_id}`);
        } catch (deleteError) {
          console.error(`❌ Failed to delete image ${image.public_id}:`, deleteError);
        }
      }
    }
    
    await foodItem.deleteOne();
    console.log("✅ Food item deleted successfully");
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ error: "Failed to delete food item" });
  }
};

module.exports = {
  createFoodItem,
  getAllFoodItems,
  getFoodItemById,
  updateFoodItem,
  deleteFoodItem,
};
    const mongoose = require('mongoose');
    const { v2: cloudinary } = require('cloudinary');
    const FoodItemModel = require('./models/foodItem.model');
    require('dotenv').config();

    // Configure Cloudinary (same as your existing setup)
    cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Food data with image URLs to upload
    const foods = [
  // Nigerian Main Dishes
  {
    name: "Jollof Rice",
    description: "Classic Nigerian jollof rice with chicken",
    price: 1800,
    category: "main",
    imageUrl: "https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg",
    available: true,
  },
  
  {
    name: "Pear",
    description: "Fresh pear",
    price: 300,
    category: "dessert",
    imageUrl: "https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg",
    available: true,
  },

]

    const uploadImageFromUrl = async (imageUrl, foodName) => {
    try {
        // Cloudinary can upload directly from URL
        const result = await cloudinary.uploader.upload(imageUrl, {
        folder: "food_items",
        public_id: `food-${foodName.toLowerCase().replace(/\s+/g, '-')}`,
        resource_type: "image"
        });
        
        return {
        public_id: result.public_id,
        url: result.secure_url,
        name: result.original_filename || foodName
        };
    } catch (error) {
        console.error(`Error uploading image for ${foodName}:`, error);
        return null;
    }
    };

    const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected...");

        // Clear existing data
        await FoodItemModel.deleteMany({});
        console.log("🗑️ Old foods cleared");

        // Process each food item
        for (const food of foods) {
        const imageUpload = await uploadImageFromUrl(food.imageUrl, food.name);
        
        if (imageUpload) {
            const newFood = await FoodItemModel.create({
            name: food.name,
            description: food.description,
            price: food.price,
            category: food.category,
            available: food.available,
            images: [imageUpload]
            });
            
            console.log(`✅ Created: ${food.name}`);
        } else {
            console.log(`❌ Failed to create: ${food.name}`);
        }
        }

        console.log("🍲 Seed completed successfully!");
        process.exit();
    } catch (error) {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    }
    };

    seedDatabase();


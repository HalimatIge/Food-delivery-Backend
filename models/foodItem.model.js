const mongoose = require("mongoose");

const FoodItemSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Food name is required"] }, 
  description: { type: String, required: [true, "Description is required"] }, 
  price: { type: Number, required: [true, "Price is required"] }, 
  category: {
    type: String,
    enum: ["starter", "main", "dessert", "beverage", "appetizer", "special","side"], // Categories of food
    required: true,
  },
  images: [
    {
      public_id: {
        type: String,
        // required: true,
      },
      name: {
        type: String,
        // required: true,
      },
      url: {
        type: String,
        // required: [true, 'file url (file_upload.url)'],
      },
    },
  ],
  // image: { type: String, required: [true, "Image URL is required"] }, // Image URL of the food item
  available: { type: Boolean, default: true }, 
  isPopular: { type: Boolean, default: false },
  isSpecial: { type: Boolean, default: false },

  dateAdded: { type: Date, default: Date.now }, 
});

const FoodItemModel = mongoose.model("FoodItem", FoodItemSchema);
module.exports = FoodItemModel;

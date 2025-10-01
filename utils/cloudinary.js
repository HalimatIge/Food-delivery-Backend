

// config/cloudinary.js
const { v2: cloudinary } = require('cloudinary');

// Ensure dotenv is loaded
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  require('dotenv').config();
}

console.log("🔧 Configuring Cloudinary...");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Verify configuration
const config = cloudinary.config();
console.log("✅ Cloudinary configured:");
console.log("- Cloud Name:", config.cloud_name);
console.log("- API Key:", config.api_key ? config.api_key.substring(0, 5) + "..." : "❌ Missing");
console.log("- API Secret:", config.api_secret ? "✅ Set" : "❌ Missing");

// Export the configured cloudinary instance
module.exports = cloudinary;
const mongoose = require("mongoose");
let bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  firstname: { type: String, required: [true, "Firstname field is required"] },
  lastname: { type: String, required: [true, "Lastname field is required"] }, 
  email: {
    type: String,
    required: [true, "Email field is required"],
    unique: [true, "Email already exists."], 
  },
  password: { type: String, required: [true, "Password field is required"] }, 
  phone: { type: String, default: "" },
  address: { type: String, default: "" }, 
  role: {
    type: String,
    enum: ["customer", "admin"], 
    default: "customer", 
  },
  date: { type: Date, default: Date.now },


});

// Middleware to hash the password before saving to the database
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Only hash if modified

  try {
    // Generate salt and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.log("Error hashing password:", error); 
    next(error);
  }
});

// Instance method to validate the password
UserSchema.methods.validatePassword = function (password, callback) {
  
  bcrypt.compare(password, this.password, (err, same) => {
    if (err) return callback(err, false); 
    callback(null, same);
  });
};

let UserModel = mongoose.model("users_collection", UserSchema);
module.exports = UserModel;

const Cart = require("../models/cart.model");

const saveCart = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { cart } = req.body;

 
    if (!userId || userId === "undefined" || userId === "null") {
  
      return res.status(400).json({ 
        success: false, 
        message: "Valid userId is required",
        receivedUserId: userId
      });
    }

    const updatedCart = await Cart.findOneAndUpdate(
      { userId },
      { userId, cart },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, cart: updatedCart });
  } catch (error) {
    next(error);
  }
};

const getCart = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId || userId === "undefined" || userId === "null") {
      return res.status(400).json({ 
        success: false, 
        message: "Valid userId is required",
        receivedUserId: userId,
        cart: []
      });
    }
    const cartData = await Cart.findOne({ userId });
    
    res.status(200).json({ cart: cartData?.cart || [] });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveCart,
  getCart,
};
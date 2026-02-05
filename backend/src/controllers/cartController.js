const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

const addToCart = async (userId, productId, quantity = 1) => {
  try {
 
    let cart = await Cart.findOne({ userId });

    if (!cart) {
 
      cart = new Cart({ userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    await cart.populate('items.productId');

    return { 
      success: true, 
      message: 'Item added to cart', 
      cart 
    };
  } catch (error) {
    return { 
      success: false, 
      message: 'Error adding to cart', 
      error: error.message 
    };
  }
};

const getCart = async (userId) => {
  try {
    const cart = await Cart.findOne({ userId })
      .populate('items.productId');

    if (!cart) {
      return { 
        success: true, 
        cart: { items: [] } 
      };
    }

    return { 
      success: true, 
      cart 
    };
  } catch (error) {
    return { 
      success: false, 
      message: 'Error fetching cart', 
      error: error.message 
    };
  }
};

const updateCartItem = async (userId, productId, quantity) => {
  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return { 
        success: false, 
        message: 'Cart not found' 
      };
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return { 
        success: false, 
        message: 'Item not found in cart' 
      };
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    await cart.populate('items.productId');

    return { 
      success: true, 
      message: 'Cart updated', 
      cart 
    };
  } catch (error) {
    return { 
      success: false, 
      message: 'Error updating cart', 
      error: error.message 
    };
  }
};

const removeFromCart = async (userId, productId) => {
  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return { 
        success: false, 
        message: 'Cart not found' 
      };
    }

    cart.items = cart.items.filter(
      item => item.productId.toString() !== productId
    );

    await cart.save();
    await cart.populate('items.productId');

    return { 
      success: true, 
      message: 'Item removed from cart', 
      cart 
    };
  } catch (error) {
    return { 
      success: false, 
      message: 'Error removing item', 
      error: error.message 
    };
  }
};

const clearCart = async (userId) => {
  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return { 
        success: false, 
        message: 'Cart not found' 
      };
    }

    cart.items = [];
    await cart.save();

    return { 
      success: true, 
      message: 'Cart cleared', 
      cart 
    };
  } catch (error) {
    return { 
      success: false, 
      message: 'Error clearing cart', 
      error: error.message 
    };
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
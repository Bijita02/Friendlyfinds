const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Product = require('../models/productModel');
const { signup, login, authMiddleware } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const result = await signup(email, password, username);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await login(email, password);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    let userListings = [];
    try {
      const products = await Product.find({ sellerId: userId });
      userListings = products.map(product => ({
        _id: product._id,
        id: product._id,
        name: product.title,
        title: product.title,
        price: product.price,
        image: product.image,
        views: product.views || 0,
        category: product.category,
        condition: product.condition,
        description: product.description
      }));
    } catch (err) {
      console.error('Error fetching user listings:', err);
    }
    
    res.json({
      name: user.name || user.username || 'User',
      email: user.email || '',
      location: user.location || 'Location not set',
      phone: user.phone || null,
      birthdate: user.birthdate || '',
      bio: user.bio || 'No bio added yet.',
      createdAt: user.createdAt || new Date().toISOString(),
      profileImage: user.profileImage || null,
      listings: userListings 
    });
    
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let userListings = [];
    try {
      const products = await Product.find({ sellerId: userId });
      userListings = products.map(product => ({
        _id: product._id,
        id: product._id,
        name: product.title,
        title: product.title,
        price: product.price,
        image: product.image,
        views: product.views || 0,
        category: product.category,
        condition: product.condition,
        description: product.description
      }));
    } catch (err) {
      console.error('Error fetching user listings:', err);
    }

    const profileData = {
      name: user.name || user.username,
      username: user.username,
      email: user.email,
      location: user.location || 'Location not set',
      phone: user.phone || null,
      bio: user.bio || 'No bio added yet.',
      profileImage: user.profileImage || null,
      createdAt: user.createdAt,
      listings: userListings 
    };

    res.json(profileData);

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { name, email, location, phone, birthdate, bio, profileImage } = req.body;

    console.log('📝 Received update request:', { name, email, location, phone, birthdate, bio, profileImage: profileImage ? 'present' : 'null' });

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    if (phone && phone.trim()) {
      const phoneRegex = /^(\+977)?[9][6-9]\d{8}$/;
      const cleanPhone = phone.replace(/[\s-]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format. Use format: 9841234567 or +977-9841234567'
        });
      }
    }

    if (birthdate) {
      const birthdateObj = new Date(birthdate);
      const today = new Date();
      if (birthdateObj > today) {
        return res.status(400).json({
          success: false,
          message: 'Birthdate cannot be in the future'
        });
      }
    }

    if (bio && bio.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Bio cannot exceed 500 characters'
      });
    }

    const updateData = {};
    
    if (name !== undefined) {
      updateData.name = name && name.trim() ? name.trim() : user.username;
    }
    
    if (email !== undefined) {
      updateData.email = email && email.trim() ? email.toLowerCase().trim() : user.email;
    }
    
    if (location !== undefined) {
      updateData.location = location && location.trim() ? location.trim() : 'Location not set';
    }
    
    if (phone !== undefined) {
      updateData.phone = phone && phone.trim() ? phone.trim() : null;
    }
    
    if (birthdate !== undefined) {
      updateData.birthdate = birthdate || null;
    }
    
    if (bio !== undefined) {
      updateData.bio = bio && bio.trim() ? bio.trim() : 'No bio added yet.';
    }
    
    if (profileImage !== undefined) {
      updateData.profileImage = profileImage || null;
    }

    console.log('💾 Updating with data:', updateData);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Updated user:', {
      name: updatedUser.name,
      location: updatedUser.location,
      bio: updatedUser.bio
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      name: updatedUser.name,
      email: updatedUser.email,
      location: updatedUser.location,
      phone: updatedUser.phone,
      birthdate: updatedUser.birthdate,
      bio: updatedUser.bio,
      profileImage: updatedUser.profileImage
    });

  } catch (error) {
    console.error('UPDATE PROFILE ERROR:', error);
 
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

router.delete('/saved/:itemId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.itemId;
    
    await User.findByIdAndUpdate(userId, {
      $pull: { savedItems: itemId }
    });
    
    res.json({ 
      success: true, 
      message: 'Item removed from saved' 
    });
    
  } catch (error) {
    console.error('Error removing saved item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
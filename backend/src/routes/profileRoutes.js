// routes/profileRoutes.js or add to your existing auth routes

const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust path to your User model
const auth = require('../middleware/auth'); // Your authentication middleware

// GET /api/auth/profile - Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    // req.user should be set by your auth middleware with the user ID
    const user = await User.findById(req.user.id)
      .select('-password') // Exclude password
      .populate('listings') // If you have listings reference
      .populate('savedItems') // If you have saved items reference
      .populate('reviews'); // If you have reviews reference

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user data with calculated stats
    const profileData = {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      location: user.location || 'Location not set',
      phone: user.phone || null,
      birthdate: user.birthdate || null,
      bio: user.bio || 'No bio added yet.',
      profileImage: user.profileImage || null,
      createdAt: user.createdAt,
      stats: {
        listings: user.listings?.length || 0,
        rating: user.rating || 0,
        sold: user.soldItems?.length || 0
      },
      listings: user.listings || [],
      savedItems: user.savedItems || [],
      reviews: user.reviews || []
    };

    res.json(profileData);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, location, phone, birthdate, bio, profileImage } = req.body;

    // Find user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (email !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }
    if (location !== undefined) user.location = location;
    if (phone !== undefined) user.phone = phone;
    if (birthdate !== undefined) user.birthdate = birthdate;
    if (bio !== undefined) user.bio = bio;
    if (profileImage !== undefined) user.profileImage = profileImage;

    // Save updated user
    await user.save();

    // Return updated user data (excluding password)
    const updatedProfile = {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      location: user.location,
      phone: user.phone,
      birthdate: user.birthdate,
      bio: user.bio,
      profileImage: user.profileImage,
      createdAt: user.createdAt
    };

    res.json({
      message: 'Profile updated successfully',
      ...updatedProfile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
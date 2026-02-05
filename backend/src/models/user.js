const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {         
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    default: null
  },
  profileImage: {        
    type: String,     
    default: null,
  },
  
  name: {
    type: String,
    default: function() {
      return this.username;
    }
  },
   phone: {
    type: String,
    default: null
  },
  location: {
    type: String,
    default: 'Location not set'
  },
  birthdate: {
    type: Date,
    default: null
  },
  bio: {
    type: String,
    default: 'No bio added yet.',
    maxlength: 500
  },
 
  listings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
}, { timestamps: true });

module.exports = mongoose.model('user', userSchema);
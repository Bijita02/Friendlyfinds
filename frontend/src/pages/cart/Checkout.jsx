import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Navbar from '../../Components/Navbar/Navbar';
import './checkout.css';

const Checkout = () => {
  const { user } = useAuth();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    campus: '',
    pickupDate: '',
    pickupTime: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const total = getCartTotal();

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || user.fullName || '',
        email: user.email || '',
        phone: user.phone || user.phoneNumber || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  const getAuthToken = () => {

    const token = user?.token || 
                  user?.accessToken || 
                  user?.authToken ||
                  localStorage.getItem('token') || 
                  localStorage.getItem('authToken') ||
                  localStorage.getItem('access_token') ||
                  sessionStorage.getItem('token');
    
    return token;
  };

  const groupedBySeller = cartItems.reduce((acc, item) => {
    const seller = item.seller || item.sellerName || 'Unknown';
    if (!acc[seller]) {
      acc[seller] = [];
    }
    acc[seller].push(item);
    return acc;
  }, {});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(\+977)?[9][6-9]\d{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Nepali phone number';
    }

    if (!formData.campus) {
      newErrors.campus = 'Please select a campus location';
    }

    if (!formData.pickupDate) {
      newErrors.pickupDate = 'Please select a pickup date';
    }

    if (!formData.pickupTime) {
      newErrors.pickupTime = 'Please select a pickup time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const token = getAuthToken();

    if (!token) {
      alert('Authentication token not found. Please log in again.');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    try {
      setLoading(true);

      const sellers = Object.entries(groupedBySeller).map(([sellerName, items]) => ({
        sellerId: items[0].sellerId || items[0].seller_id || null,
        sellerName: sellerName,
        items: items.map(item => ({
          productId: item.id || item._id,
          productName: item.title || item.name,
          productImage: item.image || item.imageUrl,
          quantity: item.quantity || 1,
          price: item.price
        }))
      }));

      const orderData = {
        sellers: sellers,
        totalAmount: total,
        buyerName: formData.fullName,
        buyerEmail: formData.email,
        buyerLocation: formData.campus || 'Campus',
        buyerId: user?.id || user?._id || null,
        shippingAddress: {
          fullName: formData.fullName,
          phone: formData.phone,
          addressLine1: formData.campus,
          city: 'Campus',
          country: 'Nepal'
        },
        paymentMethod: 'cash_on_delivery',
        specialInstructions: `Pickup Date: ${formData.pickupDate}, Time: ${formData.pickupTime}. ${formData.notes}`
      };

      console.log('Submitting order:', orderData);

      const response = await fetch('http://localhost:5000/api/orders/cart-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (response.ok && data.success) {

        clearCart();

        alert(`🎉 Order placed successfully!\n\nOrder ID: ${data.data?.orderId || 'N/A'}\n\nYou will be redirected to your orders page.`);

        navigate('/orders', { state: { orderId: data.data?.orderId } });
      } else {

        const errorMessage = data.message || data.error || 'Failed to place order. Please try again.';
        
        if (response.status === 401 || errorMessage.includes('token') || errorMessage.includes('authentication')) {
          alert('Your session has expired. Please log in again.');
          navigate('/login', { state: { from: '/checkout' } });
        } else {
          alert(`Error: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Error placing order:', error);
      
      if (error.message.includes('fetch')) {
        alert('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <>
      <Navbar />
      
      <div className="checkout-page">
        <div className="checkout-hero">
          <h1 className="checkout-hero-title">Checkout</h1>
          <p className="checkout-hero-subtitle">Complete your order</p>
        </div>

        <div className="checkout-container">
          <div className="checkout-grid">
            <div className="checkout-form-section">
              <button className="back-button" onClick={() => navigate('/cart')}>
                <span>←</span> Back to Cart
              </button>

              <div className="checkout-form-card">
                <h2>Buyer Information</h2>

                <form onSubmit={handleSubmit}>
 
                  <div className="form-section">
                    <h3>Contact Information</h3>
                    
                    <div className="form-group">
                      <label htmlFor="fullName">Full Name *</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className={errors.fullName ? 'input-error' : ''}
                      />
                      {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        className={errors.email ? 'input-error' : ''}
                      />
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone Number *</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+977 9800000000"
                        className={errors.phone ? 'input-error' : ''}
                      />
                      {errors.phone && <span className="error-message">{errors.phone}</span>}
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Pickup Details</h3>
                    
                    <div className="form-group">
                      <label htmlFor="campus">Campus Location *</label>
                      <select
                        id="campus"
                        name="campus"
                        required
                        value={formData.campus}
                        onChange={handleInputChange}
                        className={errors.campus ? 'input-error' : ''}
                      >
                        <option value="">Select campus location</option>
                        <option value="main">Main Campus</option>
                        <option value="library">Library Building</option>
                        <option value="cafeteria">Cafeteria Area</option>
                        <option value="sports">Sports Complex</option>
                        <option value="hostel">Hostel Area</option>
                        <option value="parking">Parking Lot</option>
                      </select>
                      {errors.campus && <span className="error-message">{errors.campus}</span>}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="pickupDate">Preferred Date *</label>
                        <input
                          type="date"
                          id="pickupDate"
                          name="pickupDate"
                          required
                          min={today}
                          value={formData.pickupDate}
                          onChange={handleInputChange}
                          className={errors.pickupDate ? 'input-error' : ''}
                        />
                        {errors.pickupDate && <span className="error-message">{errors.pickupDate}</span>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="pickupTime">Preferred Time *</label>
                        <input
                          type="time"
                          id="pickupTime"
                          name="pickupTime"
                          required
                          value={formData.pickupTime}
                          onChange={handleInputChange}
                          className={errors.pickupTime ? 'input-error' : ''}
                        />
                        {errors.pickupTime && <span className="error-message">{errors.pickupTime}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Sellers You'll Meet</h3>
                    {Object.entries(groupedBySeller).map(([seller, items], index) => (
                      <div key={`${seller}-${index}`} className="seller-info">
                        <div className="seller-info-title">Seller {index + 1}</div>
                        <div className="seller-name">{seller}</div>
                        <div className="seller-items">
                          Items: {items.map(item => item.name || item.title).join(', ')} ({items.length} {items.length === 1 ? 'item' : 'items'})
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="form-section">
                    <h3>Additional Notes</h3>
                    <div className="form-group">
                      <label htmlFor="notes">Special Instructions (Optional)</label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows="4"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Any special requests or notes for the sellers..."
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="confirm-button"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        Placing Order...
                      </>
                    ) : (
                      `Confirm Order - Rs.${total.toFixed(2)}`
                    )}
                  </button>

                  <p className="payment-info">
                    💰 Payment Method: Cash on Delivery
                  </p>
                </form>
              </div>
            </div>

            <div className="checkout-summary-section">
              <div className="checkout-summary-card">
                <h2>Order Summary</h2>

                <div className="summary-items">
                  {cartItems.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="summary-item">
                      <img
                        src={item.image || item.imageUrl || '/placeholder.png'}
                        alt={item.name || item.title}
                        className="summary-item-image"
                        onError={(e) => {
                          e.target.src = '/placeholder.png';
                        }}
                      />
                      <div className="summary-item-details">
                        <div className="summary-item-name">{item.name || item.title}</div>
                        <div className="summary-item-qty">Qty: {item.quantity || 1}</div>
                      </div>
                      <div className="summary-item-price">
                        Rs.{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="summary-divider"></div>

                <div className="summary-row">
                  <span className="summary-label">Subtotal</span>
                  <span className="summary-value">Rs.{total.toFixed(2)}</span>
                </div>

                <div className="summary-row">
                  <span className="summary-label">Delivery Fee</span>
                  <span className="summary-value free">Free</span>
                </div>

                <div className="total-row">
                  <span className="total-label">Total</span>
                  <span className="total-amount">Rs.{total.toFixed(2)}</span>
                </div>

                <div className="summary-info">
                  <p>✓ Cash on Delivery</p>
                  <p>✓ Campus Pickup Available</p>
                  <p>✓ Contact Seller Directly</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;
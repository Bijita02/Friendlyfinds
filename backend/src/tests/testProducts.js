const connectDB = require('./db');
const { signup } = require('./auth');
const User = require('./userModel');
const { 
  addProduct, 
  getProductsByStatus, 
  getProductsByCategory,
  approveProduct,
  getProductsBySeller 
} = require('./productFunctions');
const { 
  createOrder, 
  getPurchaseHistory, 
  getSellingHistory 
} = require('./orderFunctions');

const testEverything = async () => {
  await connectDB();

  console.log('\n=== STEP 1: Create test users ===');
  await signup('seller@test.com', 'password123');
  await signup('buyer@test.com', 'password123');
  
  const seller = await User.findOne({ email: 'seller@test.com' });
  const buyer = await User.findOne({ email: 'buyer@test.com' });
  
  console.log('Seller ID:', seller._id);
  console.log('Buyer ID:', buyer._id);

  const sellerId = seller._id;
  const buyerId = buyer._id;

  console.log('\n=== STEP 2: Seller adds products ===');
  const product1 = await addProduct(
    'Wooden Desk',
    'Beautiful oak desk in good condition',
    5000,
    'furniture',
    'good',
    ['image1.jpg'],
    sellerId
  );
  console.log('Product 1:', product1);

  const product2 = await addProduct(
    'Pen Set',
    'Premium pen set, barely used',
    500,
    'stationary',
    'like-new',
    ['image2.jpg'],
    sellerId
  );
  console.log('Product 2:', product2);

  console.log('\n=== STEP 3: Get pending products (for admin) ===');
  const pendingProducts = await getProductsByStatus('pending');
  console.log('Pending products count:', pendingProducts.products.length);

  console.log('\n=== STEP 4: Admin approves first product ===');
  const productId = product1.product._id;
  const approved = await approveProduct(productId);
  console.log('Approved:', approved.message);

  console.log('\n=== STEP 5: Get approved furniture ===');
  const furniture = await getProductsByCategory('furniture', 'approved');
  console.log('Furniture products count:', furniture.products.length);

  console.log('\n=== STEP 6: Buyer purchases the desk ===');
  const order = await createOrder(buyerId, sellerId, productId, 5000);
  console.log('Order created:', order.message);

  console.log('\n=== STEP 7: Check buyer purchase history ===');
  const purchases = await getPurchaseHistory(buyerId);
  console.log('Buyer purchases count:', purchases.orders.length);

  console.log('\n=== STEP 8: Check seller selling history ===');
  const sales = await getSellingHistory(sellerId);
  console.log('Seller sales count:', sales.orders.length);

  console.log('\n=== STEP 9: Get seller\'s products ===');
  const sellerProducts = await getProductsBySeller(sellerId);
  console.log('Seller products count:', sellerProducts.products.length);

  console.log('\n✅ ALL TESTS COMPLETE!');
  console.log('\n📊 SUMMARY:');
  console.log('- Users created: 2');
  console.log('- Products added: 2');
  console.log('- Products approved: 1');
  console.log('- Orders created: 1');
  
  process.exit();
};

testEverything();
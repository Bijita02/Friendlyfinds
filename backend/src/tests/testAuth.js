const connectDB = require('./db');
const { signup, login } = require('./auth');

const testAuth = async () => {

  await connectDB();

  console.log('\n--- Testing Signup ---');

  const signupResult = await signup('test@example.com', 'password123');
  console.log(signupResult);

  console.log('\n--- Testing Login with correct password ---');

  const loginResult = await login('test@example.com', 'password123');
  console.log(loginResult);

  console.log('\n--- Testing Login with wrong password ---');

  const wrongLoginResult = await login('test@example.com', 'wrongpassword');
  console.log(wrongLoginResult);

  console.log('\n--- Testing Signup with existing email ---');

  const duplicateSignup = await signup('test@example.com', 'password123');
  console.log(duplicateSignup);

  process.exit();
};

testAuth();
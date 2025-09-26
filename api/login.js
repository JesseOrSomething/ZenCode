const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Simple in-memory user storage for demo
// In production, use a proper database
let users = [
  {
    id: 'admin',
    name: 'Admin',
    email: 'admin@test.com',
    password: 'admin123', // Simple password for demo
    subscription: 'pro',
    subscriptionDate: new Date(),
    isAdmin: true
  }
];

// Function to add user (used by signup)
export function addUser(userData) {
  users.push(userData);
}

// Function to get users (for debugging)
export function getUsers() {
  return users;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = users.find(user => user.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Simple password check for demo
    if (password !== user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate simple token for demo
    const token = 'demo_token_' + user.id;

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, subscription: user.subscription || 'free' }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Simple in-memory storage with your account
const users = [
  {
    id: 'admin',
    name: 'Admin',
    email: 'admin@test.com',
    password: 'admin123',
    subscription: 'pro',
    subscriptionDate: new Date().toISOString(),
    isAdmin: true
  },
  {
    id: '1758431030333',
    name: 'Luca Portman',
    email: 'portmanluca8@gmail.com',
    password: 'demo123',
    subscription: 'free',
    subscriptionDate: new Date().toISOString()
  }
];

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

    console.log('Login attempt:', { email, password: password ? '***' : 'empty' });
    console.log('Available users:', users.map(u => ({ email: u.email, id: u.id })));

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = users.find(user => user.email === email);
    console.log('Found user:', user ? { email: user.email, id: user.id } : 'null');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Simple password check for demo
    console.log('Password check:', { provided: password, stored: user.password, match: password === user.password });
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

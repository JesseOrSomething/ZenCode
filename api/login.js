const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Load users from JSON file
function loadUsers() {
  try {
    const fs = require('fs');
    const path = require('path');
    const usersFile = path.join(__dirname, 'users.json');
    const data = fs.readFileSync(usersFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading users:', error);
    // Fallback to default users
    return [
      {
        id: 'admin',
        name: 'Admin',
        email: 'admin@test.com',
        password: 'admin123',
        subscription: 'pro',
        subscriptionDate: new Date().toISOString(),
        isAdmin: true
      }
    ];
  }
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

    console.log('Login attempt:', { email, password: password ? '***' : 'empty' });
    console.log('Available users:', users.map(u => ({ email: u.email, id: u.id })));

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Load users and find user
    const users = loadUsers();
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

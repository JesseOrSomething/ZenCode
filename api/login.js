const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// File-based user storage for persistence
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

// Load users from file
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
  
  // Return default users if file doesn't exist
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

// Save users to file
function saveUsers(users) {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

// Function to add user (used by signup)
export function addUser(userData) {
  const users = loadUsers();
  users.push(userData);
  saveUsers(users);
}

// Function to get users (for debugging)
export function getUsers() {
  return loadUsers();
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

    // Load users from file
    const users = loadUsers();
    
    // Find user
    const user = users.find(user => user.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password (handle both hashed and plain text)
    let isValidPassword = false;
    
    if (user.password.startsWith('$2')) {
      // Password is hashed, use bcrypt
      try {
        isValidPassword = await bcrypt.compare(password, user.password);
      } catch (error) {
        console.error('Bcrypt error:', error);
        isValidPassword = false;
      }
    } else {
      // Password is plain text (for demo accounts)
      isValidPassword = password === user.password;
    }
    
    if (!isValidPassword) {
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

// Load and save users from JSON file
function loadUsers() {
  try {
    const fs = require('fs');
    const path = require('path');
    const usersFile = path.join(__dirname, 'users.json');
    const data = fs.readFileSync(usersFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
}

function saveUsers(users) {
  try {
    const fs = require('fs');
    const path = require('path');
    const usersFile = path.join(__dirname, 'users.json');
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
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
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Simple validation for now
    if (email.length < 5 || password.length < 3) {
      return res.status(400).json({ error: 'Email and password must be longer' });
    }

    // Load existing users
    const users = loadUsers();
    
    // Check if user already exists
    if (users.find(user => user.email === email)) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const userId = Date.now().toString();
    
    const userData = {
      id: userId,
      name,
      email,
      password, // Store password in plain text for demo
      subscription: 'free',
      subscriptionDate: new Date().toISOString()
    };

    // Add user and save to file
    users.push(userData);
    saveUsers(users);

    const token = 'demo_token_' + userId;

    res.json({
      message: 'User created successfully',
      token,
      user: { id: userId, name, email, subscription: 'free' }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

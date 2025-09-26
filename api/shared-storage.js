// File-based persistent storage
import fs from 'fs';
import path from 'path';

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

export function getUsers() {
  return loadUsers();
}

export function addUser(userData) {
  const users = loadUsers();
  users.push(userData);
  saveUsers(users);
}

export function findUser(email) {
  const users = loadUsers();
  return users.find(user => user.email === email);
}

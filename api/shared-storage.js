// Hybrid storage - read from existing file and add new users to memory
let users = [
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

// Add existing user from data/users.json
const existingUser = {
  id: '1758431030333',
  name: 'Luca Portman',
  email: 'portmanluca8@gmail.com',
  password: '$2b$10$uzDVhU/XsTgTkktGGkq5qu/1/t15F3B7i8o64xCnTuF6i9wKfIjWe',
  subscription: 'free',
  subscriptionDate: new Date().toISOString()
};

// Add existing user if not already present
if (!users.find(u => u.email === existingUser.email)) {
  users.push(existingUser);
}

export function getUsers() {
  return users;
}

export function addUser(userData) {
  users.push(userData);
}

export function findUser(email) {
  return users.find(user => user.email === email);
}

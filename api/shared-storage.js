// Simple in-memory storage with your account pre-loaded
let users = [
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

export function getUsers() {
  return users;
}

export function addUser(userData) {
  users.push(userData);
}

export function findUser(email) {
  return users.find(user => user.email === email);
}

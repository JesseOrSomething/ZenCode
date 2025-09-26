// Shared in-memory storage for demo
// In production, use a proper database
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

export function getUsers() {
  return users;
}

export function addUser(userData) {
  users.push(userData);
}

export function findUser(email) {
  return users.find(user => user.email === email);
}

// Simple login handler
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

    // Check hardcoded accounts first
    if (email === 'portmanluca8@gmail.com' && password === 'demo123') {
      res.json({
        message: 'Login successful',
        token: 'demo_token_1758431030333',
        user: { 
          id: '1758431030333', 
          name: 'Luca Portman', 
          email: 'portmanluca8@gmail.com', 
          subscription: 'free' 
        }
      });
    } else if (email === 'admin@test.com' && password === 'admin123') {
      res.json({
        message: 'Login successful',
        token: 'demo_token_admin',
        user: { 
          id: 'admin', 
          name: 'Admin', 
          email: 'admin@test.com', 
          subscription: 'pro' 
        }
      });
    } else {
      // For any other email/password combination, accept it as a new user
      // This is a demo implementation - in production you'd want proper validation
      const userId = Date.now().toString();
      res.json({
        message: 'Login successful',
        token: 'demo_token_' + userId,
        user: { 
          id: userId, 
          name: 'New User', 
          email: email, 
          subscription: 'free' 
        }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Debug: Check if environment variables are loaded
console.log('Environment check:');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Loaded' : 'NOT LOADED');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Loaded' : 'NOT LOADED');

const app = express();
const PORT = process.env.PORT || 3000;

// Database file paths
const DATA_DIR = './data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');
const USAGE_FILE = path.join(DATA_DIR, 'usage.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load data from files
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
  return [];
}

function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

function loadConversations() {
  try {
    if (fs.existsSync(CONVERSATIONS_FILE)) {
      const data = fs.readFileSync(CONVERSATIONS_FILE, 'utf8');
      return new Map(JSON.parse(data));
    }
  } catch (error) {
    console.error('Error loading conversations:', error);
  }
  return new Map();
}

function saveConversations() {
  try {
    fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify([...conversations]));
  } catch (error) {
    console.error('Error saving conversations:', error);
  }
}

function loadUsage() {
  try {
    if (fs.existsSync(USAGE_FILE)) {
      const data = fs.readFileSync(USAGE_FILE, 'utf8');
      return new Map(JSON.parse(data));
    }
  } catch (error) {
    console.error('Error loading usage:', error);
  }
  return new Map();
}

function saveUsage() {
  try {
    fs.writeFileSync(USAGE_FILE, JSON.stringify([...userUsage]));
  } catch (error) {
    console.error('Error saving usage:', error);
  }
}

// Load data on startup
const users = loadUsers();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Subscription plans
const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    dailyLimit: 3,
    features: ['3 questions per day', 'Basic AI responses', 'Text-only conversations']
  },
  pro: {
    name: 'Pro',
    price: 17.49,
    dailyLimit: -1, // unlimited
    features: ['Unlimited questions', 'Image analysis', 'Conversation history', 'Priority support']
  }
};

// Load persistent data
const conversations = loadConversations();
const userUsage = loadUsage();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware
app.use(bodyParser.json({ limit: '50mb' })); // Increase limit for large images

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Authentication routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(user);
    saveUsers(); // Save to file

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user.id, name: user.name, email: user.email },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = users.find(user => user.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user subscription info
app.get('/api/subscription', authenticateToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const plan = SUBSCRIPTION_PLANS[user.subscription || 'free'];
    const today = new Date().toDateString();
    const usage = userUsage.get(user.id) || {};
    const todayUsage = usage[today] || 0;
    
    res.json({
      plan: user.subscription || 'free',
      planDetails: plan,
      usage: {
        today: todayUsage,
        limit: plan.dailyLimit,
        unlimited: plan.dailyLimit === -1
      }
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update subscription (for free plan)
app.post('/api/subscription', authenticateToken, (req, res) => {
  try {
    const { plan } = req.body;
    
    if (!SUBSCRIPTION_PLANS[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Only allow free plan updates directly
    if (plan === 'free') {
      user.subscription = plan;
      user.subscriptionDate = new Date();
      saveUsers(); // Save to file
      
      res.json({ 
        message: 'Subscription updated successfully',
        plan: plan,
        planDetails: SUBSCRIPTION_PLANS[plan]
      });
    } else {
      // For paid plans, redirect to payment
      res.status(402).json({ 
        error: 'Payment required',
        message: 'Please complete payment to upgrade to Pro plan',
        redirectToPayment: true
      });
    }
  } catch (error) {
    console.error('Subscription update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Stripe checkout session
app.post('/api/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { plan } = req.body;
    
    if (plan !== 'pro') {
      return res.status(400).json({ error: 'Invalid plan for payment' });
    }
    
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Pro Plan - Monthly',
            description: 'Unlimited AI questions and features',
          },
          unit_amount: 1749, // $17.49 in cents
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing.html`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        plan: 'pro'
      }
    });
    
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Payment setup failed' });
  }
});

// Handle successful payment
app.post('/api/payment-success', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid' && session.subscription) {
      const user = users.find(u => u.id === req.user.id);
      if (user) {
        user.subscription = 'pro';
        user.subscriptionDate = new Date();
        user.stripeCustomerId = session.customer;
        user.stripeSubscriptionId = session.subscription;
        saveUsers(); // Save to file
        
        res.json({ 
          message: 'Payment successful! Pro plan activated.',
          plan: 'pro',
          planDetails: SUBSCRIPTION_PLANS.pro
        });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Cancel subscription
app.post('/api/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.subscription !== 'pro' || !user.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription to cancel' });
    }

    // Cancel the subscription immediately
    await stripe.subscriptions.cancel(user.stripeSubscriptionId);

    // Downgrade user to free plan
    user.subscription = 'free';
    user.subscriptionDate = null;
    user.stripeSubscriptionId = null;
    saveUsers(); // Save to file

    res.json({ 
      message: 'Subscription cancelled successfully. You have been downgraded to the Free plan.',
      plan: 'free',
      planDetails: SUBSCRIPTION_PLANS.free
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, image, conversationId } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        error: 'Message is required' 
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured' 
      });
    }

    // Check usage limits for authenticated users
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = users.find(u => u.id === decoded.id);
        
        if (user) {
          const plan = SUBSCRIPTION_PLANS[user.subscription || 'free'];
          const today = new Date().toDateString();
          const usage = userUsage.get(user.id) || {};
          const todayUsage = usage[today] || 0;
          
          // Check if user has exceeded daily limit
          if (plan.dailyLimit !== -1 && todayUsage >= plan.dailyLimit) {
            return res.status(429).json({
              error: 'Daily limit exceeded',
              message: `You've reached your daily limit of ${plan.dailyLimit} questions. Please upgrade your plan for unlimited access.`,
              upgradeRequired: true
            });
          }
          
          // Track usage
          if (!userUsage.has(user.id)) {
            userUsage.set(user.id, {});
          }
          const userUsageData = userUsage.get(user.id);
          userUsageData[today] = (userUsageData[today] || 0) + 1;
        }
      } catch (error) {
        // Invalid token, continue as unauthenticated
      }
    }

    // Get or create conversation history
    const convId = conversationId || 'default';
    if (!conversations.has(convId)) {
      conversations.set(convId, []);
      saveConversations(); // Save to file
    }
    const conversationHistory = conversations.get(convId);

    // Prepare the message content
    let messageContent;
    if (image) {
      console.log('Image received, length:', image.length);
      console.log('Image starts with:', image.substring(0, 50));
      
      // Validate the image format
      if (!image.startsWith('data:image/')) {
        console.error('Invalid image format:', image.substring(0, 20));
        return res.status(400).json({ 
          error: 'Invalid image format. Please upload a valid image file.' 
        });
      }
      
      // If image is provided, create a multimodal message
      messageContent = [
        {
          type: "text",
          text: message
        },
        {
          type: "image_url",
          image_url: {
            url: image // This should be the full data URL like "data:image/jpeg;base64,/9j/4AAQ..."
          }
        }
      ];
    } else {
      // If no image, just use text
      messageContent = message;
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-0613', // Use gpt-4-0613 for reliable performance
        messages: [
          {
            role: 'system',
            content: 'You are ChatGPT 5-mini, a fast and cost-efficient AI language model developed by OpenAI. When asked about your identity, identify yourself as ChatGPT 5-mini. Otherwise, respond normally to user questions without mentioning your model name unless specifically asked.'
          },
          ...conversationHistory,
          {
            role: 'user',
            content: messageContent
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      console.error('Request body was:', JSON.stringify({
        model: 'gpt-4-0613',
        messages: [{ role: 'user', content: messageContent }]
      }, null, 2));
      return res.status(500).json({ 
        error: 'Failed to get AI response',
        details: errorData.error?.message || 'Unknown error'
      });
    }

    const data = await response.json();
    const aiReply = data.choices[0].message.content;

    // Add the conversation to history
    conversationHistory.push(
      { role: 'user', content: messageContent },
      { role: 'assistant', content: aiReply }
    );

    // Keep only last 20 messages to prevent context overflow
    if (conversationHistory.length > 20) {
      conversationHistory.splice(0, conversationHistory.length - 20);
    }
    
    // Save conversation to file
    saveConversations();

    res.json({ 
      response: aiReply
    });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ 
      error: 'Something went wrong',
      details: error.message 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

// Serve static files (after all API routes)
app.use(express.static('.'));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Make sure OPENAI_API_KEY is set in your .env file`);
});

module.exports = app;
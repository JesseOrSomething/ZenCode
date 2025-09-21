const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Data persistence
const DATA_DIR = './data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');
const USAGE_FILE = path.join(DATA_DIR, 'usage.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
  return {};
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
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading conversations:', error);
  }
  return {};
}

function saveConversations() {
  try {
    fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(conversations, null, 2));
  } catch (error) {
    console.error('Error saving conversations:', error);
  }
}

function loadUsage() {
  try {
    if (fs.existsSync(USAGE_FILE)) {
      const data = fs.readFileSync(USAGE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading usage:', error);
  }
  return {};
}

function saveUsage() {
  try {
    fs.writeFileSync(USAGE_FILE, JSON.stringify(userUsage, null, 2));
  } catch (error) {
    console.error('Error saving usage:', error);
  }
}

// Load data
const users = loadUsers();
const conversations = loadConversations();
const userUsage = loadUsage();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
function authenticateToken(req, res, next) {
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
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

// Sign up
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (users[email]) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Date.now().toString();

    users[email] = {
      id: userId,
      username,
      email,
      password: hashedPassword,
      subscription: 'free',
      subscriptionId: null,
      createdAt: new Date().toISOString()
    };

    saveUsers();

    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'User created successfully',
      token,
      user: { id: userId, username, email, subscription: 'free' }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = users[email];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email, subscription: user.subscription }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  console.log('Chat endpoint hit:', req.method, req.url);
  try {
    const { message, image, conversationId } = req.body;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    let user = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        user = users[decoded.email];
      } catch (err) {
        console.log('Invalid token, proceeding as guest');
      }
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check subscription limits
    if (user && user.subscription === 'free') {
      const usage = userUsage[user.id] || { questions: 0, lastReset: new Date().toISOString() };
      const today = new Date().toISOString().split('T')[0];
      const lastReset = usage.lastReset.split('T')[0];
      
      if (today !== lastReset) {
        usage.questions = 0;
        usage.lastReset = new Date().toISOString();
      }
      
      if (usage.questions >= 20) {
        return res.status(429).json({ 
          error: 'Daily limit reached. Upgrade to Pro for unlimited questions.',
          limit: 20,
          used: usage.questions
        });
      }
      
      usage.questions++;
      userUsage[user.id] = usage;
      saveUsage();
    }

    const conversation = conversationId && conversations[conversationId] 
      ? conversations[conversationId] 
      : { messages: [] };

    conversation.messages.push({ role: 'user', content: message });

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-0613',
        messages: [
          {
            role: 'system',
            content: 'You are ChatGPT 5-mini, a fast and cost-efficient AI language model developed by OpenAI. When asked about your identity, identify yourself as ChatGPT 5-mini. Otherwise, respond normally to user questions without mentioning your model name unless specifically asked.'
          },
          ...conversation.messages
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('OpenAI API error:', errorData);
      return res.status(500).json({ error: 'AI service temporarily unavailable' });
    }

    const aiResponse = await openaiResponse.json();
    const aiMessage = aiResponse.choices[0].message.content;

    conversation.messages.push({ role: 'assistant', content: aiMessage });

    const newConversationId = conversationId || Date.now().toString();
    conversations[newConversationId] = conversation;
    saveConversations();

    res.json({
      response: aiMessage,
      conversationId: newConversationId
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Sorry, I encountered an error processing your request.' });
  }
});

// Create checkout session
app.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { plan } = req.body;
    const user = users[req.user.email];

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
      success_url: `${process.env.FRONTEND_URL}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing.html`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        plan: plan
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Payment setup failed' });
  }
});

// Payment success
app.post('/payment-success', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const user = users[req.user.email];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      user.subscription = 'pro';
      user.subscriptionId = session.subscription;
      saveUsers();
      
      res.json({ 
        message: 'Subscription activated successfully',
        subscription: 'pro'
      });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Payment success error:', error);
    res.status(500).json({ error: 'Failed to activate subscription' });
  }
});

// Cancel subscription
app.post('/api/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    const user = users[req.user.email];

    if (!user || !user.subscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    await stripe.subscriptions.cancel(user.subscriptionId);
    
    user.subscription = 'free';
    user.subscriptionId = null;
    saveUsers();

    res.json({ 
      message: 'Subscription cancelled successfully',
      subscription: 'free'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Get user info
app.get('/api/user', authenticateToken, (req, res) => {
  const user = users[req.user.email];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    subscription: user.subscription
  });
});

module.exports = app;

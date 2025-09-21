const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Load data from files
function loadUsers() {
  try {
    const usersFile = path.join(process.cwd(), 'data', 'users.json');
    if (fs.existsSync(usersFile)) {
      const data = fs.readFileSync(usersFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
  return {};
}

function loadConversations() {
  try {
    const conversationsFile = path.join(process.cwd(), 'data', 'conversations.json');
    if (fs.existsSync(conversationsFile)) {
      const data = fs.readFileSync(conversationsFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading conversations:', error);
  }
  return {};
}

function saveConversations(conversations) {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const conversationsFile = path.join(dataDir, 'conversations.json');
    fs.writeFileSync(conversationsFile, JSON.stringify(conversations, null, 2));
  } catch (error) {
    console.error('Error saving conversations:', error);
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
    const { message, image, conversationId } = req.body;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    let user = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const users = loadUsers();
        user = users[decoded.email];
      } catch (err) {
        console.log('Invalid token, proceeding as guest');
      }
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const conversations = loadConversations();
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
    saveConversations(conversations);

    res.json({
      response: aiMessage,
      conversationId: newConversationId
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Sorry, I encountered an error processing your request.' });
  }
}

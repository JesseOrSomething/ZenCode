const jwt = require('jsonwebtoken');

export default async function handler(req, res) {
  console.log('Chat API hit:', req.method, req.url);
  
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
    console.log('Request body:', req.body);
    const { message, image, conversationId } = req.body;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Message:', message);
    console.log('Token present:', !!token);

    let user = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log('Token decoded:', decoded.email);
        // For now, just verify the token without user lookup
        user = { id: decoded.userId, email: decoded.email };
      } catch (err) {
        console.log('Invalid token, proceeding as guest');
      }
    }

    if (!message) {
      console.log('No message provided');
      return res.status(400).json({ error: 'Message is required' });
    }

    // Simplified conversation handling for now
    const conversation = { messages: [] };
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

    res.json({
      response: aiMessage,
      conversationId: newConversationId
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Sorry, I encountered an error processing your request.' });
  }
}

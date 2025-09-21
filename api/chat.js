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
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Simple AI response without external dependencies
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.text();
      console.error('OpenAI API error:', errorData);
      return res.status(500).json({ error: 'AI service temporarily unavailable' });
    }

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices[0].message.content;

    res.json({
      response: aiMessage,
      conversationId: Date.now().toString()
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Sorry, I encountered an error processing your request.' });
  }
}

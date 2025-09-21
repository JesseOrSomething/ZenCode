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
    const { plan } = req.body;

    if (!plan) {
      return res.status(400).json({ error: 'Plan is required' });
    }

    // For now, return a mock session ID
    // In production, you would integrate with Stripe here
    const mockSessionId = 'cs_test_' + Date.now();

    res.json({
      sessionId: mockSessionId,
      message: 'Checkout session created (demo mode)'
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Error creating checkout session' });
  }
}

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

    // For demo purposes, redirect directly to payment success
    // In production, you would integrate with real Stripe checkout
    const mockSessionId = 'cs_test_' + Date.now();
    const baseUrl = process.env.FRONTEND_URL || 'https://zen-code-beta.vercel.app';
    const successUrl = `${baseUrl}/payment-success.html?session_id=${mockSessionId}`;

    res.json({
      sessionId: mockSessionId,
      url: successUrl,
      message: 'Checkout session created (demo mode)'
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Error creating checkout session' });
  }
}

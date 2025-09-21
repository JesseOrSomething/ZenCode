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

    if (plan !== 'pro') {
      return res.status(400).json({ error: 'Invalid plan for payment' });
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://zen-code-beta.vercel.app';

    // Create Stripe checkout session using REST API
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': 'Pro Plan - Monthly',
        'line_items[0][price_data][product_data][description]': 'Unlimited coding questions and features',
        'line_items[0][price_data][unit_amount]': '1749',
        'line_items[0][price_data][recurring][interval]': 'month',
        'line_items[0][quantity]': '1',
        'mode': 'subscription',
        'success_url': `${baseUrl}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${baseUrl}/pricing.html`,
        'metadata[plan]': plan
      })
    });

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.text();
      console.error('Stripe API error:', errorData);
      return res.status(500).json({ error: 'Stripe API error' });
    }

    const session = await stripeResponse.json();

    res.json({
      sessionId: session.id,
      url: session.url,
      message: 'Checkout session created'
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Error creating checkout session' });
  }
}

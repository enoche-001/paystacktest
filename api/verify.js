export default async function handler(req, res) {
  // ── CORS: only allow your actual school domains ──
  const allowed = [
    'https://hilltopvisuals.name.ng',       // update to your actual domain
    'https://school-8b30a.web.app',         // Firebase Hosting domain
    'https://school-8b30a.firebaseapp.com'  // Firebase fallback domain
  ];
  const origin = req.headers.origin || '';
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── Validate reference ──
  const { reference } = req.body;
  if (!reference || typeof reference !== 'string' || !/^[a-zA-Z0-9_\-]+$/.test(reference)) {
    return res.status(400).json({ status: false, message: 'Invalid or missing reference' });
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`
      }
    });

    const data = await response.json();

    // ── Only return success if Paystack confirms the transaction succeeded ──
    if (!data.status || data.data?.status !== 'success') {
      return res.status(200).json({
        status: false,
        message: data.data?.gateway_response || data.message || 'Transaction not successful',
        data: {
          status: data.data?.status || 'unknown',
          amount: data.data?.amount || 0
        }
      });
    }

    // ── Return a clean, safe response (don't expose full Paystack object) ──
    return res.status(200).json({
      status: true,
      message: 'Verification successful',
      data: {
        status:   data.data.status,
        amount:   data.data.amount,           // in kobo
        currency: data.data.currency,
        reference: data.data.reference,
        paid_at:  data.data.paid_at
      }
    });

  } catch (err) {
    return res.status(500).json({ status: false, error: 'Server error', detail: err.message });
  }
}

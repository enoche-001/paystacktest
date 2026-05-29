export default async function handler(req, res) {

  // Allow your domain
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { reference } = req.body

  if (!reference) {
    return res.status(400).json({ status: false, message: 'No reference' })
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`
        }
      }
    )

    const data = await response.json()
    return res.status(200).json(data)

  } catch (err) {
    return res.status(500).json({ status: false, message: 'Verification failed' })
  }
}

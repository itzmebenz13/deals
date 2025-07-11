const axios = require('axios');

// This is a Vercel Serverless Function
export default async function handler(req, res) {
    // Allow POST requests and handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests are allowed' });
    }

    const { url: shareUrl } = req.body;

    if (!shareUrl || !shareUrl.includes('temu.com')) {
        return res.status(400).json({ success: false, message: 'A valid Temu URL is required.' });
    }

    try {
        const response = await axios.get(shareUrl, {
            maxRedirects: 0,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            validateStatus: (status) => status >= 200 && status < 400,
        });

        const finalUrl = response.headers.location;
        if (!finalUrl) throw new Error('Could not find a redirect location.');

        const urlObject = new URL(finalUrl);
        const goodsId = urlObject.searchParams.get('goods_id');

        if (goodsId) {
            res.status(200).json({ success: true, goods_id: goodsId });
        } else {
            throw new Error('Goods ID not found in the final URL.');
        }
    } catch (error) {
        console.error('Extraction failed:', error.message);
        res.status(500).json({ success: false, message: 'Failed to extract Goods ID.' });
    }
}

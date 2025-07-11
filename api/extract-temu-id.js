// This is a Vercel Serverless Function with ZERO dependencies
import { get } from 'https';
import { URL } from 'url';

export default function handler(request, response) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'POST');
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return response.status(200).end();
    }

    // Set CORS headers for the actual request
    response.setHeader('Access-Control-Allow-Origin', '*');

    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Only POST requests are allowed' });
    }

    const { url: shareUrl } = request.body;

    if (!shareUrl || !shareUrl.includes('temu.com')) {
        return response.status(400).json({ success: false, message: 'A valid Temu URL is required.' });
    }

    const req = get(shareUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        }
    }, (res) => {
        // We are looking for a redirect, which has status 301 or 302
        if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
            try {
                const finalUrl = res.headers.location;
                const urlObject = new URL(finalUrl);
                const goodsId = urlObject.searchParams.get('goods_id');

                if (goodsId) {
                    response.status(200).json({ success: true, goods_id: goodsId });
                } else {
                    response.status(404).json({ success: false, message: 'Goods ID not found in the final URL.' });
                }
            } catch (e) {
                response.status(500).json({ success: false, message: 'Error parsing the final URL.' });
            }
        } else {
            response.status(400).json({ success: false, message: 'Link did not redirect as expected.' });
        }
    });

    req.on('error', (e) => {
        console.error(e);
        response.status(500).json({ success: false, message: 'Failed to fetch the URL.' });
    });
}

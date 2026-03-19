import { kv } from '@vercel/kv';

export default async function handler(request, response) {
    if (request.method === 'GET') {
        try {
            const config = await kv.get('husky_pass_settings');
            return response.status(200).json(config || null);
        } catch (error) {
            console.error('Vercel KV GET Error:', error);
            return response.status(500).json({ error: 'Failed to fetch config. Ensure Vercel KV is connected.' });
        }
    } else if (request.method === 'POST') {
        try {
            const newConfig = request.body;
            await kv.set('husky_pass_settings', newConfig);
            return response.status(200).json({ success: true, config: newConfig });
        } catch (error) {
            console.error('Vercel KV POST Error:', error);
            return response.status(500).json({ error: 'Failed to save config. Ensure Vercel KV is connected.' });
        }
    } else {
        response.setHeader('Allow', ['GET', 'POST']);
        return response.status(405).end(`Method ${request.method} Not Allowed`);
    }
}
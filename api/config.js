import Redis from 'ioredis';

export default async function handler(request, response) {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        return response.status(503).json({ 
            error: 'La variable de entorno REDIS_URL no está configurada en Vercel.' 
        });
    }

    let redis;
    try {
        // Initialize Redis with a short timeout so it fails fast if something goes wrong
        redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 1,
            connectTimeout: 3000,
        });

        if (request.method === 'GET') {
            const data = await redis.get('husky_pass_settings');
            
            let configData = null;
            if (data) {
                try { configData = JSON.parse(data); } catch(e) {}
            }

            // Budget protector: Cache in Vercel Edge for 15 seconds.
            response.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
            return response.status(200).json(configData);
            
        } else if (request.method === 'POST') {
            const stringifiedConfig = JSON.stringify(request.body);
            await redis.set('husky_pass_settings', stringifiedConfig);
            return response.status(200).json({ success: true });
        } else {
            response.setHeader('Allow', ['GET', 'POST']);
            return response.status(405).end(`Method ${request.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Redis API Error:', error);
        return response.status(500).json({ error: 'No se pudo conectar a la base de datos Redis.' });
    } finally {
        if (redis) {
            // Always cleanly quit in serverless environments to prevent hanging functions
            redis.quit();
        }
    }
}
export default async function handler(request, response) {
    // Dynamically check for either Vercel KV or Upstash Redis env variables
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        return response.status(503).json({ 
            error: 'Redis no configurado. Faltan variables de entorno KV_REST_API_URL o UPSTASH_REDIS_REST_URL en Vercel.' 
        });
    }

    if (request.method === 'GET') {
        try {
            const res = await fetch(`${url}/get/husky_pass_settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            
            let configData = data.result;
            if (typeof configData === 'string') {
                try { configData = JSON.parse(configData); } catch(e) {}
            }

            // Budget protector: Cache in Vercel Edge for 15 seconds. 
            // If 50 devices poll simultaneously, Redis is only queried ONCE.
            response.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
            return response.status(200).json(configData || null);
            
        } catch (error) {
            console.error('Redis GET Error:', error);
            return response.status(500).json({ error: 'Fallo al leer config de Redis' });
        }
    } 
    
    else if (request.method === 'POST') {
        try {
            const stringifiedConfig = JSON.stringify(request.body);
            const res = await fetch(`${url}/set/husky_pass_settings`, {
                method: 'POST',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: stringifiedConfig
            });
            
            if (!res.ok) throw new Error('Error guardando en Redis');
            
            return response.status(200).json({ success: true });
        } catch (error) {
            console.error('Redis POST Error:', error);
            return response.status(500).json({ error: 'Fallo al guardar config en Redis' });
        }
    } 
    
    else {
        response.setHeader('Allow', ['GET', 'POST']);
        return response.status(405).end(`Method ${request.method} Not Allowed`);
    }
}
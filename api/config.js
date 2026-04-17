import mysql from 'mysql2/promise';

export default async function handler(request, response) {
    const { MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_PORT } = process.env;

    if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
        return response.status(503).json({ 
            error: 'Las credenciales de acceso a la base de datos MySQL no están configuradas.' 
        });
    }

    let connection;
    try {
        // Inicializar la conexión a MySQL
        connection = await mysql.createConnection({
            host: MYSQL_HOST,
            user: MYSQL_USER,
            password: MYSQL_PASSWORD,
            database: MYSQL_DATABASE,
            port: MYSQL_PORT ? parseInt(MYSQL_PORT, 10) : 3306,
            connectTimeout: 5000,
        });

        if (request.method === 'GET') {
            const [rows] = await connection.execute('SELECT config_data FROM husky_pass_config WHERE id = 1');
            
            let configData = null;
            if (rows.length > 0) {
                try { configData = JSON.parse(rows[0].config_data); } catch(e) {}
            }

            // Uso eficiente de recursos en Vercel Edge: Cache durante 15 segundos
            response.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
            return response.status(200).json(configData || {});
            
        } else if (request.method === 'POST') {
            const stringifiedConfig = JSON.stringify(request.body);
            
            // Actualiza o inserta la configuración de manera atómica
            await connection.execute(
                'INSERT INTO husky_pass_config (id, config_data) VALUES (1, ?) ON DUPLICATE KEY UPDATE config_data = ?',
                [stringifiedConfig, stringifiedConfig]
            );
            
            return response.status(200).json({ success: true });
        } else {
            response.setHeader('Allow', ['GET', 'POST']);
            return response.status(405).end(`Método ${request.method} no permitido`);
        }
    } catch (error) {
        console.error('Error en la API de MySQL:', error);
        return response.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    } finally {
        if (connection) {
            // Cerrar limpiamente la conexión en entornos serverless
            await connection.end();
        }
    }
}
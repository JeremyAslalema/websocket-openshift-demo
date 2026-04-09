"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupHealthRoutes = setupHealthRoutes;
function setupHealthRoutes(app, getStats) {
    // Health check básico
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'websocket-server'
        });
    });
    // Health check detallado (readiness probe)
    app.get('/ready', (req, res) => {
        const stats = getStats();
        res.status(200).json({
            status: 'ready',
            connections: stats.activeConnections,
            uptime: stats.uptime,
            timestamp: new Date().toISOString()
        });
    });
    // Health check para liveness probe
    app.get('/live', (req, res) => {
        res.status(200).json({
            status: 'alive',
            timestamp: new Date().toISOString()
        });
    });
    // Página de bienvenida
    app.get('/', (req, res) => {
        res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>WebSocket Server</title>
          <style>
            body { font-family: Arial; padding: 20px; background: #1E3A5F; color: white; }
            .container { max-width: 800px; margin: 0 auto; }
            .status { background: #2ECC71; padding: 10px; border-radius: 5px; margin: 20px 0; }
            code { background: #333; padding: 2px 5px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 WebSocket Server Activo</h1>
            <div class="status">✅ Servidor funcionando correctamente</div>
            <h2>Endpoints disponibles:</h2>
            <ul>
              <li><code>GET /health</code> - Health check básico</li>
              <li><code>GET /ready</code> - Readiness probe</li>
              <li><code>GET /live</code> - Liveness probe</li>
              <li><code>WebSocket</code> - Conectar via Socket.io</li>
            </ul>
            <h2>Conectar desde cliente:</h2>
            <p>Usa Socket.io client para conectar a: <code>wss://[TU_URL]</code></p>
            <p>O prueba con <code>wscat -c wss://[TU_URL]/socket.io/?EIO=4&transport=websocket</code></p>
          </div>
        </body>
      </html>
    `);
    });
}

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketManager } from './websocket';
import { setupHealthRoutes } from './health';

// Cargar variables de entorno
dotenv.config();

const PORT = process.env.PORT || 8080;
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Inicializar WebSocket Manager
const wsManager = new WebSocketManager(httpServer);

// Configurar rutas de health check
setupHealthRoutes(app, () => wsManager.getStats());

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Servidor WebSocket ejecutándose en puerto ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log('='.repeat(50));
});

// Manejo graceful shutdown
process.on('SIGTERM', () => {
  console.log('Recibida señal SIGTERM, cerrando servidor...');
  httpServer.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nRecibida señal SIGINT, cerrando servidor...');
  httpServer.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
});

export { app, httpServer, wsManager };
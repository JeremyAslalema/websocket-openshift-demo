"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wsManager = exports.httpServer = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const websocket_1 = require("./websocket");
const health_1 = require("./health");
// Cargar variables de entorno
dotenv_1.default.config();
const PORT = process.env.PORT || 8080;
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Inicializar WebSocket Manager
const wsManager = new websocket_1.WebSocketManager(httpServer);
exports.wsManager = wsManager;
// Configurar rutas de health check
(0, health_1.setupHealthRoutes)(app, () => wsManager.getStats());
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

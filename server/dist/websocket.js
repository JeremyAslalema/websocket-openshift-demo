"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketManager = void 0;
const socket_io_1 = require("socket.io");
class WebSocketManager {
    constructor(httpServer) {
        this.clients = new Map();
        this.totalConnections = 0;
        this.startTime = new Date();
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            },
            path: '/socket.io/',
            transports: ['websocket', 'polling'],
            allowEIO3: true
        });
        this.setupMiddleware();
        this.setupEventHandlers();
    }
    setupMiddleware() {
        this.io.use((socket, next) => {
            const clientIp = socket.handshake.address;
            const userAgent = socket.handshake.headers['user-agent'];
            console.log(`[AUTH] Nueva conexión desde ${clientIp}`);
            next();
        });
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }
    handleConnection(socket) {
        this.totalConnections++;
        const clientInfo = {
            id: socket.id,
            connectedAt: new Date(),
            ip: socket.handshake.address,
            userAgent: socket.handshake.headers['user-agent']
        };
        this.clients.set(socket.id, clientInfo);
        console.log(`[CONNECT] Cliente ${socket.id} conectado desde ${clientInfo.ip}`);
        console.log(`[STATS] Clientes activos: ${this.clients.size}`);
        // Enviar mensaje de bienvenida
        const welcomeMessage = {
            type: 'welcome',
            content: `¡Bienvenido al servidor WebSocket! Tu ID es: ${socket.id}`,
            clientId: socket.id,
            timestamp: new Date().toISOString()
        };
        socket.emit('message', welcomeMessage);
        // Notificar a otros clientes
        const systemMessage = {
            type: 'system',
            content: `Nuevo cliente conectado (ID: ${socket.id.substring(0, 8)})`,
            timestamp: new Date().toISOString()
        };
        socket.broadcast.emit('message', systemMessage);
        // Enviar estadísticas
        this.sendStats(socket);
        // Event handlers
        socket.on('message', (data) => {
            this.handleMessage(socket, data);
        });
        socket.on('disconnect', (reason) => {
            this.handleDisconnect(socket, reason);
        });
        socket.on('error', (error) => {
            console.error(`[ERROR] Cliente ${socket.id}:`, error.message);
        });
        socket.on('getStats', () => {
            this.sendStats(socket);
        });
    }
    handleMessage(socket, data) {
        console.log(`[MESSAGE] ${socket.id}:`, data);
        const message = {
            type: 'message',
            content: data.content || data.text || data.toString(),
            clientId: socket.id,
            timestamp: new Date().toISOString()
        };
        // Broadcast a todos los clientes (incluyendo al emisor)
        this.io.emit('message', message);
    }
    handleDisconnect(socket, reason) {
        const clientInfo = this.clients.get(socket.id);
        this.clients.delete(socket.id);
        console.log(`[DISCONNECT] Cliente ${socket.id} desconectado. Razón: ${reason}`);
        console.log(`[STATS] Clientes activos: ${this.clients.size}`);
        const disconnectMessage = {
            type: 'system',
            content: `Cliente ${socket.id.substring(0, 8)} se desconectó`,
            timestamp: new Date().toISOString()
        };
        socket.broadcast.emit('message', disconnectMessage);
    }
    sendStats(socket) {
        const stats = {
            totalConnections: this.totalConnections,
            activeConnections: this.clients.size,
            uptime: Date.now() - this.startTime.getTime(),
            rooms: new Map()
        };
        socket.emit('stats', stats);
    }
    getStats() {
        return {
            totalConnections: this.totalConnections,
            activeConnections: this.clients.size,
            uptime: Date.now() - this.startTime.getTime(),
            rooms: new Map()
        };
    }
    getIO() {
        return this.io;
    }
}
exports.WebSocketManager = WebSocketManager;

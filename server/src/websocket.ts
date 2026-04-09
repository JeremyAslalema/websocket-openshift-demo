import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { ChatMessage, ClientInfo, ServerStats } from './types';

export class WebSocketManager {
  private io: SocketServer;
  private clients: Map<string, ClientInfo> = new Map();
  private totalConnections: number = 0;
  private startTime: Date = new Date();

  constructor(httpServer: HttpServer) {
    this.io = new SocketServer(httpServer, {
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

  private setupMiddleware(): void {
    this.io.use((socket, next) => {
      const clientIp = socket.handshake.address;
      const userAgent = socket.handshake.headers['user-agent'];
      
      console.log(`[AUTH] Nueva conexión desde ${clientIp}`);
      next();
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  private handleConnection(socket: any): void {
    this.totalConnections++;
    const clientInfo: ClientInfo = {
      id: socket.id,
      connectedAt: new Date(),
      ip: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent']
    };

    this.clients.set(socket.id, clientInfo);
    
    console.log(`[CONNECT] Cliente ${socket.id} conectado desde ${clientInfo.ip}`);
    console.log(`[STATS] Clientes activos: ${this.clients.size}`);

    // Enviar mensaje de bienvenida
    const welcomeMessage: ChatMessage = {
      type: 'welcome',
      content: `¡Bienvenido al servidor WebSocket! Tu ID es: ${socket.id}`,
      clientId: socket.id,
      timestamp: new Date().toISOString()
    };
    socket.emit('message', welcomeMessage);

    // Notificar a otros clientes
    const systemMessage: ChatMessage = {
      type: 'system',
      content: `Nuevo cliente conectado (ID: ${socket.id.substring(0, 8)})`,
      timestamp: new Date().toISOString()
    };
    socket.broadcast.emit('message', systemMessage);

    // Enviar estadísticas
    this.sendStats(socket);

    // Event handlers
    socket.on('message', (data: any) => {
      this.handleMessage(socket, data);
    });

    socket.on('disconnect', (reason: string) => {
      this.handleDisconnect(socket, reason);
    });

    socket.on('error', (error: Error) => {
      console.error(`[ERROR] Cliente ${socket.id}:`, error.message);
    });

    socket.on('getStats', () => {
      this.sendStats(socket);
    });
  }

  private handleMessage(socket: any, data: any): void {
    console.log(`[MESSAGE] ${socket.id}:`, data);

    const message: ChatMessage = {
      type: 'message',
      content: data.content || data.text || data.toString(),
      clientId: socket.id,
      timestamp: new Date().toISOString()
    };

    // Broadcast a todos los clientes (incluyendo al emisor)
    this.io.emit('message', message);
  }

  private handleDisconnect(socket: any, reason: string): void {
    const clientInfo = this.clients.get(socket.id);
    this.clients.delete(socket.id);

    console.log(`[DISCONNECT] Cliente ${socket.id} desconectado. Razón: ${reason}`);
    console.log(`[STATS] Clientes activos: ${this.clients.size}`);

    const disconnectMessage: ChatMessage = {
      type: 'system',
      content: `Cliente ${socket.id.substring(0, 8)} se desconectó`,
      timestamp: new Date().toISOString()
    };
    
    socket.broadcast.emit('message', disconnectMessage);
  }

  private sendStats(socket: any): void {
    const stats: ServerStats = {
      totalConnections: this.totalConnections,
      activeConnections: this.clients.size,
      uptime: Date.now() - this.startTime.getTime(),
      rooms: new Map()
    };

    socket.emit('stats', stats);
  }

  public getStats(): ServerStats {
    return {
      totalConnections: this.totalConnections,
      activeConnections: this.clients.size,
      uptime: Date.now() - this.startTime.getTime(),
      rooms: new Map()
    };
  }

  public getIO(): SocketServer {
    return this.io;
  }
}
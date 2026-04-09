export interface ChatMessage {
  type: 'message' | 'system' | 'welcome' | 'error';
  content: string;
  clientId?: string;
  timestamp: string;
  room?: string;
}

export interface ClientInfo {
  id: string;
  connectedAt: Date;
  ip: string;
  userAgent?: string;
}

export interface ServerStats {
  totalConnections: number;
  activeConnections: number;
  uptime: number;
  rooms: Map<string, number>;
}
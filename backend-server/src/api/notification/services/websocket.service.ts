import { EntityType, IdGeneratorService } from '@/utils/id-generator.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: Date;
  id?: string;
}

export interface ConnectedClient {
  id: string;
  userId: string;
  socket: any; // WebSocket instance
  connectedAt: Date;
  lastActivity: Date;
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private clients = new Map<string, ConnectedClient>();
  private userConnections = new Map<string, Set<string>>(); // userId -> Set of client IDs

  constructor(
    private configService: ConfigService,
    private idGeneratorService: IdGeneratorService,
  ) {}

  // Client connection management
  addClient(
    clientId: string,
    userId: string,
    socket: any,
    metadata?: any,
  ): void {
    const client: ConnectedClient = {
      id: clientId,
      userId,
      socket,
      connectedAt: new Date(),
      lastActivity: new Date(),
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    };

    this.clients.set(clientId, client);

    // Track user connections
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(clientId);

    this.logger.log(`Client connected: ${clientId} for user: ${userId}`);
    this.logger.log(`Total active connections: ${this.clients.size}`);

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connection_established',
      data: {
        clientId,
        timestamp: new Date(),
        message: 'Connected to Cowors real-time notifications',
      },
    });
  }

  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    // Remove from user connections
    const userClients = this.userConnections.get(client.userId);
    if (userClients) {
      userClients.delete(clientId);
      if (userClients.size === 0) {
        this.userConnections.delete(client.userId);
      }
    }

    this.clients.delete(clientId);
    this.logger.log(
      `Client disconnected: ${clientId} for user: ${client.userId}`,
    );
    this.logger.log(`Total active connections: ${this.clients.size}`);
  }

  updateClientActivity(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastActivity = new Date();
    }
  }

  // Message sending methods
  async sendToClient(
    clientId: string,
    message: WebSocketMessage,
  ): Promise<boolean> {
    const client = this.clients.get(clientId);
    if (!client || !client.socket) {
      return false;
    }

    try {
      const messageWithId = {
        ...message,
        id: this.generateMessageId(),
        timestamp: new Date(),
      };

      // Check if socket is still open
      if (client.socket.readyState === 1) {
        // WebSocket.OPEN
        client.socket.send(JSON.stringify(messageWithId));
        this.updateClientActivity(clientId);
        return true;
      } else {
        // Remove dead connection
        this.removeClient(clientId);
        return false;
      }
    } catch (error) {
      this.logger.error(`Failed to send message to client ${clientId}:`, error);
      this.removeClient(clientId);
      return false;
    }
  }

  async sendToUser(userId: string, message: WebSocketMessage): Promise<number> {
    const userClients = this.userConnections.get(userId);
    if (!userClients || userClients.size === 0) {
      this.logger.debug(`No active connections for user: ${userId}`);
      return 0;
    }

    let successCount = 0;
    const promises = Array.from(userClients).map(async (clientId) => {
      const success = await this.sendToClient(clientId, message);
      if (success) successCount++;
    });

    await Promise.all(promises);
    this.logger.debug(
      `Sent message to ${successCount}/${userClients.size} clients for user: ${userId}`,
    );
    return successCount;
  }

  async sendToMultipleUsers(
    userIds: string[],
    message: WebSocketMessage,
  ): Promise<number> {
    let totalSent = 0;
    const promises = userIds.map(async (userId) => {
      const sent = await this.sendToUser(userId, message);
      totalSent += sent;
    });

    await Promise.all(promises);
    return totalSent;
  }

  async broadcast(
    message: WebSocketMessage,
    excludeUsers?: string[],
  ): Promise<number> {
    const excludeSet = new Set(excludeUsers || []);
    let successCount = 0;

    const promises = Array.from(this.clients.values())
      .filter((client) => !excludeSet.has(client.userId))
      .map(async (client) => {
        const success = await this.sendToClient(client.id, message);
        if (success) successCount++;
      });

    await Promise.all(promises);
    this.logger.log(`Broadcast message sent to ${successCount} clients`);
    return successCount;
  }

  // Notification-specific methods
  async sendNotification(userId: string, notification: any): Promise<void> {
    await this.sendToUser(userId, {
      type: 'notification',
      data: notification,
    });
  }

  async sendBookingUpdate(userId: string, bookingData: any): Promise<void> {
    await this.sendToUser(userId, {
      type: 'booking_update',
      data: {
        bookingId: bookingData.bookingId,
        status: bookingData.status,
        message: bookingData.message,
        ...bookingData,
      },
    });
  }

  async sendPaymentUpdate(userId: string, paymentData: any): Promise<void> {
    await this.sendToUser(userId, {
      type: 'payment_update',
      data: {
        paymentId: paymentData.paymentId,
        status: paymentData.status,
        amount: paymentData.amount,
        message: paymentData.message,
        ...paymentData,
      },
    });
  }

  async sendWalletUpdate(userId: string, walletData: any): Promise<void> {
    await this.sendToUser(userId, {
      type: 'wallet_update',
      data: {
        balance: walletData.balance,
        transaction: walletData.transaction,
        message: walletData.message,
        ...walletData,
      },
    });
  }

  async sendSystemAlert(
    message: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
  ): Promise<void> {
    await this.broadcast({
      type: 'system_alert',
      data: {
        message,
        priority,
        timestamp: new Date(),
      },
    });
  }

  async sendMaintenanceNotice(maintenanceData: any): Promise<void> {
    await this.broadcast({
      type: 'maintenance_notice',
      data: {
        startTime: maintenanceData.startTime,
        endTime: maintenanceData.endTime,
        message: maintenanceData.message,
        affectedServices: maintenanceData.affectedServices,
      },
    });
  }

  // Partner-specific notifications
  async sendPartnerNotification(
    partnerId: string,
    notification: any,
  ): Promise<void> {
    await this.sendToUser(partnerId, {
      type: 'partner_notification',
      data: notification,
    });
  }

  async sendNewBookingAlert(
    partnerId: string,
    bookingData: any,
  ): Promise<void> {
    await this.sendToUser(partnerId, {
      type: 'new_booking',
      data: {
        bookingId: bookingData.bookingId,
        spaceName: bookingData.spaceName,
        customerName: bookingData.customerName,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        amount: bookingData.amount,
        message: `New booking received for ${bookingData.spaceName}`,
      },
    });
  }

  // Utility methods
  private generateMessageId(): string {
    return this.idGeneratorService.generateId(EntityType.MESSAGE);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.userConnections.keys());
  }

  getUserConnectionCount(userId: string): number {
    const userClients = this.userConnections.get(userId);
    return userClients ? userClients.size : 0;
  }

  getTotalConnections(): number {
    return this.clients.size;
  }

  getConnectionStats(): any {
    const now = new Date();
    const stats = {
      totalConnections: this.clients.size,
      uniqueUsers: this.userConnections.size,
      connectionsPerUser: {},
      oldestConnection: null as Date | null,
      newestConnection: null as Date | null,
      averageConnectionAge: 0,
    };

    let totalAge = 0;
    let oldestTime = now.getTime();
    let newestTime = 0;

    // Calculate per-user connections
    for (const [userId, clientIds] of this.userConnections.entries()) {
      stats.connectionsPerUser[userId] = clientIds.size;
    }

    // Calculate connection age statistics
    for (const client of this.clients.values()) {
      const connectionAge = now.getTime() - client.connectedAt.getTime();
      totalAge += connectionAge;

      if (client.connectedAt.getTime() < oldestTime) {
        oldestTime = client.connectedAt.getTime();
        stats.oldestConnection = client.connectedAt;
      }

      if (client.connectedAt.getTime() > newestTime) {
        newestTime = client.connectedAt.getTime();
        stats.newestConnection = client.connectedAt;
      }
    }

    if (this.clients.size > 0) {
      stats.averageConnectionAge = totalAge / this.clients.size;
    }

    return stats;
  }

  // Cleanup methods
  cleanupStaleConnections(maxIdleMinutes: number = 30): number {
    const cutoffTime = new Date(Date.now() - maxIdleMinutes * 60 * 1000);
    let removedCount = 0;

    for (const [clientId, client] of this.clients.entries()) {
      if (client.lastActivity < cutoffTime) {
        this.removeClient(clientId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.log(`Cleaned up ${removedCount} stale connections`);
    }

    return removedCount;
  }

  disconnectUser(userId: string): number {
    const userClients = this.userConnections.get(userId);
    if (!userClients) {
      return 0;
    }

    let disconnectedCount = 0;
    for (const clientId of userClients) {
      const client = this.clients.get(clientId);
      if (client && client.socket) {
        try {
          client.socket.close();
          disconnectedCount++;
        } catch (error) {
          this.logger.error(
            `Error closing socket for client ${clientId}:`,
            error,
          );
        }
      }
      this.removeClient(clientId);
    }

    this.logger.log(
      `Disconnected ${disconnectedCount} connections for user: ${userId}`,
    );
    return disconnectedCount;
  }

  disconnectAll(): number {
    const totalConnections = this.clients.size;

    for (const [clientId, client] of this.clients.entries()) {
      if (client.socket) {
        try {
          client.socket.close();
        } catch (error) {
          this.logger.error(
            `Error closing socket for client ${clientId}:`,
            error,
          );
        }
      }
    }

    this.clients.clear();
    this.userConnections.clear();

    this.logger.log(`Disconnected all ${totalConnections} connections`);
    return totalConnections;
  }
}

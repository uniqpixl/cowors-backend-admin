import { Logger, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationService } from './notification.service';
import { WebSocketService } from './services/websocket.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private webSocketService: WebSocketService,
    private notificationService: NotificationService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket, ...args: any[]) {
    try {
      // Extract token from query or headers
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.verifyToken(token);
      if (!payload) {
        this.logger.warn(`Connection rejected: Invalid token`);
        client.disconnect();
        return;
      }

      // Attach user info to socket
      client.userId = payload.sub;
      client.user = payload;

      // Add client to WebSocket service
      this.webSocketService.addClient(client.id, client.userId, client, {
        userAgent: client.handshake.headers['user-agent'],
        ipAddress: client.handshake.address,
      });

      // Join user-specific room
      client.join(`user:${client.userId}`);

      // Send unread notification count
      const unreadCount = await this.notificationService.getUnreadCount(
        client.userId,
      );
      client.emit('unread_count', { count: unreadCount });

      this.logger.log(
        `Client connected: ${client.id} for user: ${client.userId}`,
      );
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.webSocketService.removeClient(client.id);
      client.leave(`user:${client.userId}`);
      this.logger.log(
        `Client disconnected: ${client.id} for user: ${client.userId}`,
      );
    }
  }

  private extractToken(client: AuthenticatedSocket): string | null {
    // Try to get token from query parameters
    const queryToken = client.handshake.query.token as string;
    if (queryToken) {
      return queryToken;
    }

    // Try to get token from authorization header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  private async verifyToken(token: string): Promise<any> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      return await this.jwtService.verifyAsync(token, { secret });
    } catch (error) {
      this.logger.error('Token verification failed:', error);
      return null;
    }
  }

  // Message handlers
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket): void {
    this.webSocketService.updateClientActivity(client.id);
    client.emit('pong', { timestamp: new Date() });
  }

  @SubscribeMessage('mark_notification_read')
  async handleMarkNotificationRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      await this.notificationService.markAsRead(
        data.notificationId,
        client.userId,
      );

      // Send updated unread count
      const unreadCount = await this.notificationService.getUnreadCount(
        client.userId,
      );
      client.emit('unread_count', { count: unreadCount });

      client.emit('notification_marked_read', {
        notificationId: data.notificationId,
        success: true,
      });
    } catch (error) {
      this.logger.error('Error marking notification as read:', error);
      client.emit('error', { message: 'Failed to mark notification as read' });
    }
  }

  @SubscribeMessage('mark_all_read')
  async handleMarkAllRead(
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      await this.notificationService.markAllAsRead(client.userId);

      client.emit('all_notifications_marked_read', { success: true });
      client.emit('unread_count', { count: 0 });
    } catch (error) {
      this.logger.error('Error marking all notifications as read:', error);
      client.emit('error', {
        message: 'Failed to mark all notifications as read',
      });
    }
  }

  @SubscribeMessage('get_notifications')
  async handleGetNotifications(
    @MessageBody() data: { page?: number; limit?: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      const { page = 1, limit = 20 } = data;
      const result = await this.notificationService.getUserNotifications(
        client.userId,
        { page, limit },
      );

      client.emit('notifications', {
        notifications: result.notifications,
        total: result.total,
        page,
        limit,
      });
    } catch (error) {
      this.logger.error('Error getting notifications:', error);
      client.emit('error', { message: 'Failed to get notifications' });
    }
  }

  @SubscribeMessage('subscribe_to_updates')
  handleSubscribeToUpdates(
    @MessageBody() data: { types: string[] },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): void {
    if (!client.userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    // Join specific update rooms
    data.types.forEach((type) => {
      const room = `${type}:${client.userId}`;
      client.join(room);
      this.logger.debug(`Client ${client.id} subscribed to ${room}`);
    });

    client.emit('subscribed_to_updates', { types: data.types });
  }

  @SubscribeMessage('unsubscribe_from_updates')
  handleUnsubscribeFromUpdates(
    @MessageBody() data: { types: string[] },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): void {
    if (!client.userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    // Leave specific update rooms
    data.types.forEach((type) => {
      const room = `${type}:${client.userId}`;
      client.leave(room);
      this.logger.debug(`Client ${client.id} unsubscribed from ${room}`);
    });

    client.emit('unsubscribed_from_updates', { types: data.types });
  }

  // Server-side methods for sending notifications
  async sendNotificationToUser(
    userId: string,
    notification: any,
  ): Promise<void> {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  async sendBookingUpdateToUser(
    userId: string,
    bookingData: any,
  ): Promise<void> {
    this.server.to(`user:${userId}`).emit('booking_update', bookingData);
    this.server
      .to(`booking_updates:${userId}`)
      .emit('booking_update', bookingData);
  }

  async sendPaymentUpdateToUser(
    userId: string,
    paymentData: any,
  ): Promise<void> {
    this.server.to(`user:${userId}`).emit('payment_update', paymentData);
    this.server
      .to(`payment_updates:${userId}`)
      .emit('payment_update', paymentData);
  }

  async sendWalletUpdateToUser(userId: string, walletData: any): Promise<void> {
    this.server.to(`user:${userId}`).emit('wallet_update', walletData);
    this.server
      .to(`wallet_updates:${userId}`)
      .emit('wallet_update', walletData);
  }

  async broadcastSystemAlert(alert: any): Promise<void> {
    this.server.emit('system_alert', alert);
  }

  async broadcastMaintenanceNotice(notice: any): Promise<void> {
    this.server.emit('maintenance_notice', notice);
  }

  // Admin methods
  async sendToAllUsers(event: string, data: any): Promise<void> {
    this.server.emit(event, data);
  }

  async sendToSpecificUsers(
    userIds: string[],
    event: string,
    data: any,
  ): Promise<void> {
    userIds.forEach((userId) => {
      this.server.to(`user:${userId}`).emit(event, data);
    });
  }

  // Statistics and monitoring
  getConnectionStats(): any {
    return {
      totalConnections: this.server.sockets.sockets.size,
      rooms: Array.from(this.server.sockets.adapter.rooms.keys()),
      ...this.webSocketService.getConnectionStats(),
    };
  }

  async disconnectUser(userId: string): Promise<void> {
    const sockets = await this.server.in(`user:${userId}`).fetchSockets();
    sockets.forEach((socket) => {
      socket.disconnect();
    });
  }

  async disconnectAllUsers(): Promise<void> {
    this.server.disconnectSockets();
  }
}

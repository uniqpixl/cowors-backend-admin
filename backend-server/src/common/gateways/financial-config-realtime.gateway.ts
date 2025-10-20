import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import { Logger, UseGuards } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
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
import {
  ConfigurationScope,
  ConfigurationType,
} from '../types/financial-configuration.types';

interface ConfigSubscription {
  socketId: string;
  userId: string;
  type: ConfigurationType;
  scope: ConfigurationScope;
  scopeId?: string;
  filters?: {
    region?: string;
    category?: string;
    partnerId?: string;
  };
}

interface ConfigUpdateNotification {
  type: ConfigurationType;
  scope: ConfigurationScope;
  scopeId?: string;
  configuration: any;
  version: number;
  timestamp: Date;
  updatedBy: string;
  reason?: string;
  affectedEntities?: string[];
}

@WebSocketGateway({
  namespace: '/financial-config',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class FinancialConfigRealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(FinancialConfigRealtimeGateway.name);
  private readonly subscriptions = new Map<string, ConfigSubscription[]>();
  private readonly connectedClients = new Map<
    string,
    { userId: string; roles: string[] }
  >();

  afterInit(server: Server) {
    this.logger.log('Financial Configuration Real-time Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Extract user info from JWT token (this would need proper JWT validation)
    const token =
      client.handshake.auth?.token || client.handshake.headers?.authorization;
    if (token) {
      try {
        // In a real implementation, you would validate the JWT token here
        // For now, we'll assume the token contains user info
        const userId = client.handshake.query?.userId as string;
        const roles =
          (client.handshake.query?.roles as string)?.split(',') || [];

        if (userId) {
          this.connectedClients.set(client.id, { userId, roles });
          this.logger.log(
            `User ${userId} connected with roles: ${roles.join(', ')}`,
          );
        }
      } catch (error) {
        this.logger.error('Failed to authenticate client', error.stack);
        client.disconnect();
      }
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
    this.subscriptions.delete(client.id);
  }

  @SubscribeMessage('subscribe_config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin', 'partner')
  handleConfigSubscription(
    @MessageBody()
    data: {
      type: ConfigurationType;
      scope: ConfigurationScope;
      scopeId?: string;
      filters?: {
        region?: string;
        category?: string;
        partnerId?: string;
      };
    },
    @ConnectedSocket() client: Socket,
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    const subscription: ConfigSubscription = {
      socketId: client.id,
      userId: clientInfo.userId,
      type: data.type,
      scope: data.scope,
      scopeId: data.scopeId,
      filters: data.filters,
    };

    if (!this.subscriptions.has(client.id)) {
      this.subscriptions.set(client.id, []);
    }

    this.subscriptions.get(client.id)!.push(subscription);

    client.emit('subscription_confirmed', {
      type: data.type,
      scope: data.scope,
      scopeId: data.scopeId,
      message: 'Successfully subscribed to configuration updates',
    });

    this.logger.log(
      `User ${clientInfo.userId} subscribed to ${data.type} updates for ${data.scope}${
        data.scopeId ? `:${data.scopeId}` : ''
      }`,
    );
  }

  @SubscribeMessage('unsubscribe_config')
  handleConfigUnsubscription(
    @MessageBody()
    data: {
      type: ConfigurationType;
      scope: ConfigurationScope;
      scopeId?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const subscriptions = this.subscriptions.get(client.id);
    if (subscriptions) {
      const filteredSubscriptions = subscriptions.filter(
        (sub) =>
          !(
            sub.type === data.type &&
            sub.scope === data.scope &&
            sub.scopeId === data.scopeId
          ),
      );
      this.subscriptions.set(client.id, filteredSubscriptions);

      client.emit('unsubscription_confirmed', {
        type: data.type,
        scope: data.scope,
        scopeId: data.scopeId,
        message: 'Successfully unsubscribed from configuration updates',
      });
    }
  }

  @SubscribeMessage('get_current_config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin', 'partner')
  async handleGetCurrentConfig(
    @MessageBody()
    data: {
      type: ConfigurationType;
      scope: ConfigurationScope;
      scopeId?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // This would integrate with the dynamic config service to get current config
      // For now, we'll emit a placeholder response
      client.emit('current_config', {
        type: data.type,
        scope: data.scope,
        scopeId: data.scopeId,
        configuration: {}, // Would be populated with actual config
        version: 1,
        timestamp: new Date(),
      });
    } catch (error) {
      client.emit('error', {
        message: 'Failed to retrieve current configuration',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('validate_config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async handleValidateConfig(
    @MessageBody()
    data: {
      type: ConfigurationType;
      configuration: any;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // This would integrate with validation services
      const validationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        affectedEntities: [],
      };

      client.emit('validation_result', {
        type: data.type,
        isValid: validationResult.isValid,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        affectedEntities: validationResult.affectedEntities,
      });
    } catch (error) {
      client.emit('error', {
        message: 'Failed to validate configuration',
        error: error.message,
      });
    }
  }

  // Event handlers for configuration changes
  @OnEvent('financial.config.commission.changed')
  handleCommissionConfigChange(payload: {
    config: any;
    scope: ConfigurationScope;
    scopeId?: string;
    version: number;
    timestamp: Date;
    updatedBy: string;
    reason?: string;
  }) {
    this.broadcastConfigUpdate({
      type: ConfigurationType.COMMISSION_SETTINGS,
      scope: payload.scope,
      scopeId: payload.scopeId,
      configuration: payload.config,
      version: payload.version,
      timestamp: payload.timestamp,
      updatedBy: payload.updatedBy,
      reason: payload.reason,
    });
  }

  @OnEvent('financial.config.tax.changed')
  handleTaxConfigChange(payload: {
    config: any;
    scope: ConfigurationScope;
    scopeId?: string;
    version: number;
    timestamp: Date;
    updatedBy: string;
    reason?: string;
  }) {
    this.broadcastConfigUpdate({
      type: ConfigurationType.TAX_SETTINGS,
      scope: payload.scope,
      scopeId: payload.scopeId,
      configuration: payload.config,
      version: payload.version,
      timestamp: payload.timestamp,
      updatedBy: payload.updatedBy,
      reason: payload.reason,
    });
  }

  @OnEvent('financial.config.payment.changed')
  handlePaymentConfigChange(payload: {
    config: any;
    scope: ConfigurationScope;
    scopeId?: string;
    version: number;
    timestamp: Date;
    updatedBy: string;
    reason?: string;
  }) {
    this.broadcastConfigUpdate({
      type: ConfigurationType.PAYMENT_SETTINGS,
      scope: payload.scope,
      scopeId: payload.scopeId,
      configuration: payload.config,
      version: payload.version,
      timestamp: payload.timestamp,
      updatedBy: payload.updatedBy,
      reason: payload.reason,
    });
  }

  @OnEvent('financial.config.payout.changed')
  handlePayoutConfigChange(payload: {
    config: any;
    scope: ConfigurationScope;
    scopeId?: string;
    version: number;
    timestamp: Date;
    updatedBy: string;
    reason?: string;
  }) {
    this.broadcastConfigUpdate({
      type: ConfigurationType.PAYOUT_SETTINGS,
      scope: payload.scope,
      scopeId: payload.scopeId,
      configuration: payload.config,
      version: payload.version,
      timestamp: payload.timestamp,
      updatedBy: payload.updatedBy,
      reason: payload.reason,
    });
  }

  @OnEvent('financial.config.fee.changed')
  handleFeeConfigChange(payload: {
    config: any;
    scope: ConfigurationScope;
    scopeId?: string;
    version: number;
    timestamp: Date;
    updatedBy: string;
    reason?: string;
  }) {
    this.broadcastConfigUpdate({
      type: ConfigurationType.FEE_SETTINGS,
      scope: payload.scope,
      scopeId: payload.scopeId,
      configuration: payload.config,
      version: payload.version,
      timestamp: payload.timestamp,
      updatedBy: payload.updatedBy,
      reason: payload.reason,
    });
  }

  private broadcastConfigUpdate(notification: ConfigUpdateNotification) {
    const relevantClients = this.findRelevantClients(notification);

    relevantClients.forEach((clientId) => {
      const client = this.server.sockets.sockets.get(clientId);
      if (client) {
        client.emit('config_updated', {
          type: notification.type,
          scope: notification.scope,
          scopeId: notification.scopeId,
          configuration: notification.configuration,
          version: notification.version,
          timestamp: notification.timestamp,
          updatedBy: notification.updatedBy,
          reason: notification.reason,
          affectedEntities: notification.affectedEntities,
        });

        this.logger.log(
          `Sent config update to client ${clientId} for ${notification.type}`,
        );
      }
    });
  }

  private findRelevantClients(
    notification: ConfigUpdateNotification,
  ): string[] {
    const relevantClients: string[] = [];

    this.subscriptions.forEach((subscriptions, clientId) => {
      const isRelevant = subscriptions.some((sub) => {
        // Check if subscription matches the notification
        if (sub.type !== notification.type) return false;
        if (sub.scope !== notification.scope) return false;
        if (sub.scopeId && sub.scopeId !== notification.scopeId) return false;

        // Check filters
        if (sub.filters) {
          if (sub.filters.region && notification.scopeId !== sub.filters.region)
            return false;
          if (
            sub.filters.category &&
            notification.scopeId !== sub.filters.category
          )
            return false;
          if (
            sub.filters.partnerId &&
            notification.scopeId !== sub.filters.partnerId
          )
            return false;
        }

        return true;
      });

      if (isRelevant) {
        relevantClients.push(clientId);
      }
    });

    return relevantClients;
  }

  // Admin methods for monitoring and management
  @SubscribeMessage('get_connection_stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  handleGetConnectionStats(@ConnectedSocket() client: Socket) {
    const stats = {
      totalConnections: this.connectedClients.size,
      totalSubscriptions: Array.from(this.subscriptions.values()).reduce(
        (total, subs) => total + subs.length,
        0,
      ),
      subscriptionsByType: this.getSubscriptionsByType(),
      connectedUsers: Array.from(this.connectedClients.values()).map(
        (client) => client.userId,
      ),
    };

    client.emit('connection_stats', stats);
  }

  private getSubscriptionsByType(): Record<string, number> {
    const stats: Record<string, number> = {};

    this.subscriptions.forEach((subscriptions) => {
      subscriptions.forEach((sub) => {
        const key = `${sub.type}:${sub.scope}`;
        stats[key] = (stats[key] || 0) + 1;
      });
    });

    return stats;
  }

  // Method to send targeted notifications to specific users
  public notifyUser(userId: string, notification: any) {
    const userClients = Array.from(this.connectedClients.entries())
      .filter(([_, client]) => client.userId === userId)
      .map(([socketId]) => socketId);

    userClients.forEach((clientId) => {
      const client = this.server.sockets.sockets.get(clientId);
      if (client) {
        client.emit('notification', notification);
      }
    });
  }

  // Method to broadcast system-wide announcements
  public broadcastAnnouncement(announcement: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error';
    timestamp: Date;
  }) {
    this.server.emit('system_announcement', announcement);
    this.logger.log(`Broadcasted system announcement: ${announcement.title}`);
  }

  // Method to force disconnect clients (for admin use)
  public disconnectUser(userId: string, reason?: string) {
    const userClients = Array.from(this.connectedClients.entries())
      .filter(([_, client]) => client.userId === userId)
      .map(([socketId]) => socketId);

    userClients.forEach((clientId) => {
      const client = this.server.sockets.sockets.get(clientId);
      if (client) {
        client.emit('force_disconnect', {
          reason: reason || 'Administrative action',
        });
        client.disconnect();
      }
    });

    this.logger.log(
      `Force disconnected user ${userId}: ${reason || 'No reason provided'}`,
    );
  }
}

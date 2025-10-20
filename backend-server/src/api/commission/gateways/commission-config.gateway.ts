import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Role as UserRole } from '../../../api/user/user.enum';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { RolesGuard } from '../../../guards/roles.guard';
import {
  DynamicCommissionConfigService,
  RealTimeConfigEvent,
} from '../services/dynamic-commission-config.service';

interface ConfigSubscription {
  userId: string;
  configTypes: string[];
  configIds?: string[];
  partnerId?: string;
}

interface ClientInfo {
  userId: string;
  userRole: UserRole;
  subscriptions: ConfigSubscription[];
  connectedAt: Date;
  lastActivity: Date;
}

@Injectable()
@WebSocketGateway({
  namespace: '/commission-config',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class CommissionConfigGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CommissionConfigGateway.name);
  private readonly connectedClients = new Map<string, ClientInfo>();
  private readonly subscriptions = new Map<string, Set<string>>(); // configId -> Set of socketIds

  constructor(
    private readonly dynamicConfigService: DynamicCommissionConfigService,
  ) {}

  /**
   * Handle client connection
   */
  async handleConnection(client: Socket) {
    try {
      // Extract user info from JWT token (would need proper auth middleware)
      const userId = this.extractUserIdFromToken(client);
      const userRole = this.extractUserRoleFromToken(client);

      if (!userId) {
        client.disconnect();
        return;
      }

      // Store client info
      this.connectedClients.set(client.id, {
        userId,
        userRole,
        subscriptions: [],
        connectedAt: new Date(),
        lastActivity: new Date(),
      });

      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);

      // Send initial configuration data
      await this.sendInitialConfigData(client, userId, userRole);
    } catch (error) {
      this.logger.error('Error handling client connection', error);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);

    if (clientInfo) {
      // Remove from all subscriptions
      for (const [configId, subscribers] of this.subscriptions.entries()) {
        subscribers.delete(client.id);
        if (subscribers.size === 0) {
          this.subscriptions.delete(configId);
        }
      }

      this.connectedClients.delete(client.id);
      this.logger.log(
        `Client disconnected: ${client.id} (User: ${clientInfo.userId})`,
      );
    }
  }

  /**
   * Subscribe to configuration updates
   */
  @SubscribeMessage('subscribe_config')
  async handleConfigSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody() subscription: ConfigSubscription,
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo) {
      client.emit('error', { message: 'Client not authenticated' });
      return;
    }

    try {
      // Validate subscription permissions
      if (!this.canSubscribeToConfig(clientInfo, subscription)) {
        client.emit('error', {
          message: 'Insufficient permissions for subscription',
        });
        return;
      }

      // Add subscription to client
      clientInfo.subscriptions.push(subscription);

      // Add to global subscriptions map
      if (subscription.configIds) {
        for (const configId of subscription.configIds) {
          if (!this.subscriptions.has(configId)) {
            this.subscriptions.set(configId, new Set());
          }
          this.subscriptions.get(configId).add(client.id);
        }
      }

      // Subscribe to all configs of specified types if no specific IDs
      if (!subscription.configIds && subscription.configTypes) {
        const configs =
          await this.dynamicConfigService.getAllActiveConfigurations();

        for (const configType of subscription.configTypes) {
          let configList: any[] = [];

          if (configType === 'commission_rate') {
            configList = configs.rateConfigs;
          } else if (configType === 'commission_settings') {
            configList = configs.settings;
          }

          for (const config of configList) {
            if (!this.subscriptions.has(config.id)) {
              this.subscriptions.set(config.id, new Set());
            }
            this.subscriptions.get(config.id).add(client.id);
          }
        }
      }

      client.emit('subscription_confirmed', {
        subscription,
        timestamp: new Date(),
      });

      this.logger.log(
        `Client ${client.id} subscribed to config updates: ${JSON.stringify(subscription)}`,
      );
    } catch (error) {
      this.logger.error('Error handling config subscription', error);
      client.emit('error', {
        message: 'Failed to subscribe to configuration updates',
      });
    }
  }

  /**
   * Unsubscribe from configuration updates
   */
  @SubscribeMessage('unsubscribe_config')
  async handleConfigUnsubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { configIds?: string[]; configTypes?: string[] },
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo) {
      return;
    }

    try {
      // Remove specific subscriptions
      if (data.configIds) {
        for (const configId of data.configIds) {
          const subscribers = this.subscriptions.get(configId);
          if (subscribers) {
            subscribers.delete(client.id);
            if (subscribers.size === 0) {
              this.subscriptions.delete(configId);
            }
          }
        }
      }

      // Remove subscriptions by type
      if (data.configTypes) {
        clientInfo.subscriptions = clientInfo.subscriptions.filter(
          (sub) =>
            !data.configTypes.some((type) => sub.configTypes.includes(type)),
        );
      }

      client.emit('unsubscription_confirmed', {
        unsubscribed: data,
        timestamp: new Date(),
      });

      this.logger.log(`Client ${client.id} unsubscribed from config updates`);
    } catch (error) {
      this.logger.error('Error handling config unsubscription', error);
    }
  }

  /**
   * Get current configuration status
   */
  @SubscribeMessage('get_config_status')
  async handleGetConfigStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { configId: string; configType: string },
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo) {
      return;
    }

    try {
      const config = await this.dynamicConfigService.getConfiguration(
        data.configId,
        data.configType,
      );

      if (!config) {
        client.emit('config_status_error', {
          configId: data.configId,
          error: 'Configuration not found',
        });
        return;
      }

      // Check permissions
      if (!this.canAccessConfig(clientInfo, config)) {
        client.emit('config_status_error', {
          configId: data.configId,
          error: 'Insufficient permissions',
        });
        return;
      }

      client.emit('config_status', {
        configId: data.configId,
        configType: data.configType,
        config,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error getting config status', error);
      client.emit('config_status_error', {
        configId: data.configId,
        error: 'Failed to get configuration status',
      });
    }
  }

  /**
   * Listen for configuration update events
   */
  @OnEvent('commission.config.updated')
  async handleConfigUpdated(event: RealTimeConfigEvent) {
    await this.broadcastConfigEvent(event);
  }

  @OnEvent('commission.config.created')
  async handleConfigCreated(event: RealTimeConfigEvent) {
    await this.broadcastConfigEvent(event);
  }

  @OnEvent('commission.config.deleted')
  async handleConfigDeleted(event: RealTimeConfigEvent) {
    await this.broadcastConfigEvent(event);
  }

  @OnEvent('commission.config.rollback')
  async handleConfigRollback(event: RealTimeConfigEvent) {
    await this.broadcastConfigEvent(event);
  }

  /**
   * Broadcast configuration event to subscribed clients
   */
  private async broadcastConfigEvent(event: RealTimeConfigEvent) {
    const subscribers = this.subscriptions.get(event.configId);
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const eventData = {
      ...event,
      timestamp: new Date(),
    };

    for (const socketId of subscribers) {
      const clientInfo = this.connectedClients.get(socketId);
      if (!clientInfo) {
        subscribers.delete(socketId);
        continue;
      }

      // Check if client has permission to receive this update
      if (this.canReceiveConfigUpdate(clientInfo, event)) {
        this.server.to(socketId).emit('config_updated', eventData);

        // Update client activity
        clientInfo.lastActivity = new Date();
      }
    }

    this.logger.debug(
      `Broadcasted config event ${event.type} for ${event.configId} to ${subscribers.size} clients`,
    );
  }

  /**
   * Send initial configuration data to newly connected client
   */
  private async sendInitialConfigData(
    client: Socket,
    userId: string,
    userRole: UserRole,
  ) {
    try {
      const configs =
        await this.dynamicConfigService.getAllActiveConfigurations();

      // Filter configs based on user permissions
      const filteredRateConfigs = configs.rateConfigs.filter((config) =>
        this.canAccessConfig({ userId, userRole } as ClientInfo, config),
      );

      const filteredSettings = configs.settings.filter((setting) =>
        this.canAccessConfig({ userId, userRole } as ClientInfo, setting),
      );

      client.emit('initial_config_data', {
        rateConfigs: filteredRateConfigs,
        settings: filteredSettings,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error sending initial config data', error);
      client.emit('error', {
        message: 'Failed to load initial configuration data',
      });
    }
  }

  /**
   * Check if client can subscribe to specific configuration
   */
  private canSubscribeToConfig(
    clientInfo: ClientInfo,
    subscription: ConfigSubscription,
  ): boolean {
    // Admin can subscribe to everything
    if (clientInfo.userRole === UserRole.Admin) {
      return true;
    }

    // Partners can only subscribe to their own configurations
    if (clientInfo.userRole === UserRole.Partner) {
      return subscription.partnerId === clientInfo.userId;
    }

    // Space owners can subscribe to space-specific configurations
    if (clientInfo.userRole === UserRole.User) {
      // Would need to check if user owns the spaces in the subscription
      return true; // Simplified for now
    }

    return false;
  }

  /**
   * Check if client can access specific configuration
   */
  private canAccessConfig(clientInfo: ClientInfo, config: any): boolean {
    // Admin can access everything
    if (clientInfo.userRole === UserRole.Admin) {
      return true;
    }

    // Partners can only access their own configurations
    if (clientInfo.userRole === UserRole.Partner) {
      return config.partnerId === clientInfo.userId;
    }

    // Space owners can access configurations for their spaces
    if (clientInfo.userRole === UserRole.User) {
      // Would need to check if user owns the space
      return true; // Simplified for now
    }

    return false;
  }

  /**
   * Check if client can receive configuration update
   */
  private canReceiveConfigUpdate(
    clientInfo: ClientInfo,
    event: RealTimeConfigEvent,
  ): boolean {
    // Use same logic as canAccessConfig
    return true; // Simplified for now
  }

  /**
   * Extract user ID from JWT token (simplified)
   */
  private extractUserIdFromToken(client: Socket): string | null {
    try {
      // In a real implementation, you would decode the JWT token
      // from client.handshake.auth.token or client.handshake.headers.authorization
      const token =
        client.handshake.auth?.token || client.handshake.headers?.authorization;

      if (!token) {
        return null;
      }

      // Simplified - in reality you'd decode the JWT
      // For now, return a mock user ID
      return 'mock-user-id';
    } catch (error) {
      this.logger.error('Error extracting user ID from token', error);
      return null;
    }
  }

  /**
   * Extract user role from JWT token (simplified)
   */
  private extractUserRoleFromToken(client: Socket): UserRole {
    // Simplified - in reality you'd decode the JWT
    return UserRole.Admin;
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    return {
      totalConnections: this.connectedClients.size,
      totalSubscriptions: this.subscriptions.size,
      clients: Array.from(this.connectedClients.entries()).map(
        ([socketId, info]) => ({
          socketId,
          userId: info.userId,
          userRole: info.userRole,
          subscriptionCount: info.subscriptions.length,
          connectedAt: info.connectedAt,
          lastActivity: info.lastActivity,
        }),
      ),
    };
  }

  /**
   * Force disconnect inactive clients
   */
  async cleanupInactiveClients(inactiveThresholdMinutes = 30) {
    const threshold = new Date(
      Date.now() - inactiveThresholdMinutes * 60 * 1000,
    );

    for (const [socketId, clientInfo] of this.connectedClients.entries()) {
      if (clientInfo.lastActivity < threshold) {
        this.server.to(socketId).disconnectSockets();
        this.logger.log(`Disconnected inactive client: ${socketId}`);
      }
    }
  }
}

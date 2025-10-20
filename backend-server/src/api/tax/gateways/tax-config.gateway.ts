import { Role as UserRole } from '@/api/user/user.enum';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
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
import {
  DynamicTaxConfigService,
  RealTimeTaxConfigEvent,
} from '../services/dynamic-tax-config.service';

interface TaxConfigSubscription {
  userId: string;
  configTypes: string[];
  configIds?: string[];
  region?: string;
  taxType?: string;
}

interface TaxClientInfo {
  userId: string;
  userRole: UserRole;
  subscriptions: TaxConfigSubscription[];
  connectedAt: Date;
  lastActivity: Date;
}

@Injectable()
@WebSocketGateway({
  namespace: '/tax-config',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class TaxConfigGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TaxConfigGateway.name);
  private readonly connectedClients = new Map<string, TaxClientInfo>();
  private readonly subscriptions = new Map<string, Set<string>>(); // configId -> Set of socketIds

  constructor(
    private readonly dynamicTaxConfigService: DynamicTaxConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const userId = this.extractUserIdFromToken(client);
      const userRole = this.extractUserRoleFromToken(client);

      if (!userId) {
        client.disconnect();
        return;
      }

      const clientInfo: TaxClientInfo = {
        userId,
        userRole,
        subscriptions: [],
        connectedAt: new Date(),
        lastActivity: new Date(),
      };

      this.connectedClients.set(client.id, clientInfo);

      // Send initial tax configuration data
      await this.sendInitialTaxConfigData(client, userId, userRole);

      this.logger.log(`Tax config client connected: ${userId} (${client.id})`);
    } catch (error) {
      this.logger.error('Error handling tax config connection', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      // Remove from all subscriptions
      for (const subscription of clientInfo.subscriptions) {
        for (const configId of subscription.configIds || []) {
          const subscribers = this.subscriptions.get(configId);
          if (subscribers) {
            subscribers.delete(client.id);
            if (subscribers.size === 0) {
              this.subscriptions.delete(configId);
            }
          }
        }
      }

      this.connectedClients.delete(client.id);
      this.logger.log(
        `Tax config client disconnected: ${clientInfo.userId} (${client.id})`,
      );
    }
  }

  @SubscribeMessage('subscribe_tax_config')
  async handleTaxConfigSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody() subscription: TaxConfigSubscription,
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo) {
      return { error: 'Client not authenticated' };
    }

    try {
      // Validate subscription permissions
      if (!this.canSubscribeToTaxConfig(clientInfo, subscription)) {
        return { error: 'Insufficient permissions for subscription' };
      }

      // Add to client subscriptions
      clientInfo.subscriptions.push(subscription);
      clientInfo.lastActivity = new Date();

      // Add to global subscriptions map
      if (subscription.configIds) {
        for (const configId of subscription.configIds) {
          if (!this.subscriptions.has(configId)) {
            this.subscriptions.set(configId, new Set());
          }
          this.subscriptions.get(configId)!.add(client.id);
        }
      }

      // Send current configuration data for subscribed items
      for (const configType of subscription.configTypes) {
        try {
          if (configType === 'tax_rule') {
            const configs =
              await this.dynamicTaxConfigService.getTaxRuleConfigs({
                region: subscription.region,
                taxType: subscription.taxType,
                isActive: true,
              });

            client.emit('tax_config_data', {
              configType: 'tax_rule',
              configs: configs.filter((config) =>
                this.canAccessTaxConfig(clientInfo, config),
              ),
            });
          } else if (configType === 'tax_settings') {
            const config = await this.dynamicTaxConfigService.getTaxSettings();
            if (this.canAccessTaxConfig(clientInfo, config)) {
              client.emit('tax_config_data', {
                configType: 'tax_settings',
                config,
              });
            }
          }
        } catch (error) {
          this.logger.error(
            `Error sending tax config data for ${configType}`,
            error,
          );
        }
      }

      this.logger.debug(
        `Tax config subscription added for client ${clientInfo.userId}`,
      );
      return {
        success: true,
        message: 'Subscribed to tax configuration updates',
      };
    } catch (error) {
      this.logger.error('Error handling tax config subscription', error);
      return { error: 'Failed to subscribe to tax configuration updates' };
    }
  }

  @SubscribeMessage('unsubscribe_tax_config')
  async handleTaxConfigUnsubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { configIds?: string[]; configTypes?: string[] },
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo) {
      return { error: 'Client not authenticated' };
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

      // Remove from client subscriptions
      if (data.configTypes) {
        clientInfo.subscriptions = clientInfo.subscriptions.filter(
          (sub) =>
            !data.configTypes!.some((type) => sub.configTypes.includes(type)),
        );
      }

      if (data.configIds) {
        clientInfo.subscriptions = clientInfo.subscriptions.filter(
          (sub) => !data.configIds!.some((id) => sub.configIds?.includes(id)),
        );
      }

      clientInfo.lastActivity = new Date();

      this.logger.debug(
        `Tax config unsubscription processed for client ${clientInfo.userId}`,
      );
      return {
        success: true,
        message: 'Unsubscribed from tax configuration updates',
      };
    } catch (error) {
      this.logger.error('Error handling tax config unsubscription', error);
      return { error: 'Failed to unsubscribe from tax configuration updates' };
    }
  }

  @SubscribeMessage('get_tax_config_status')
  async handleGetTaxConfigStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { configId: string; configType: string },
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo) {
      return { error: 'Client not authenticated' };
    }

    try {
      let config;
      if (data.configType === 'tax_rule') {
        config = await this.dynamicTaxConfigService.getTaxRuleConfig(
          data.configId,
        );
      } else if (data.configType === 'tax_settings') {
        config = await this.dynamicTaxConfigService.getTaxSettings();
      }

      if (!config || !this.canAccessTaxConfig(clientInfo, config)) {
        return { error: 'Configuration not found or access denied' };
      }

      const versionHistory =
        await this.dynamicTaxConfigService.getVersionHistory(
          data.configType,
          data.configId,
          5,
        );

      clientInfo.lastActivity = new Date();

      return {
        success: true,
        config,
        versionHistory,
        lastUpdated: config.updatedAt || config.createdAt,
      };
    } catch (error) {
      this.logger.error('Error getting tax config status', error);
      return { error: 'Failed to get tax configuration status' };
    }
  }

  // Event handlers for real-time updates
  @OnEvent('tax.config.updated')
  async handleTaxConfigUpdated(event: RealTimeTaxConfigEvent) {
    await this.broadcastTaxConfigEvent(event);
  }

  @OnEvent('tax.config.created')
  async handleTaxConfigCreated(event: RealTimeTaxConfigEvent) {
    await this.broadcastTaxConfigEvent(event);
  }

  @OnEvent('tax.config.deleted')
  async handleTaxConfigDeleted(event: RealTimeTaxConfigEvent) {
    await this.broadcastTaxConfigEvent(event);
  }

  @OnEvent('tax.config.rollback')
  async handleTaxConfigRollback(event: RealTimeTaxConfigEvent) {
    await this.broadcastTaxConfigEvent(event);
  }

  private async broadcastTaxConfigEvent(event: RealTimeTaxConfigEvent) {
    try {
      const subscribers = this.subscriptions.get(event.configId) || new Set();

      for (const socketId of subscribers) {
        const client = this.server.sockets.sockets.get(socketId);
        const clientInfo = this.connectedClients.get(socketId);

        if (
          client &&
          clientInfo &&
          this.canReceiveTaxConfigUpdate(clientInfo, event)
        ) {
          client.emit('tax_config_update', {
            eventType: event.eventType,
            configType: event.configType,
            configId: event.configId,
            configuration: event.configuration,
            previousConfiguration: event.previousConfiguration,
            effectiveDate: event.effectiveDate,
            updatedBy: event.updatedBy,
            timestamp: event.timestamp,
            metadata: event.metadata,
          });

          clientInfo.lastActivity = new Date();
        }
      }

      this.logger.debug(
        `Broadcasted tax config ${event.eventType} event for ${event.configType} ${event.configId} to ${subscribers.size} clients`,
      );
    } catch (error) {
      this.logger.error('Error broadcasting tax config event', error);
    }
  }

  private async sendInitialTaxConfigData(
    client: Socket,
    userId: string,
    userRole: UserRole,
  ) {
    try {
      // Send basic tax configuration data based on user role
      if (userRole === UserRole.Admin || userRole === UserRole.SuperAdmin) {
        // Send all active tax rules
        const taxRules = await this.dynamicTaxConfigService.getTaxRuleConfigs({
          isActive: true,
        });

        client.emit('initial_tax_config_data', {
          taxRules: taxRules.slice(0, 20), // Limit initial data
          timestamp: new Date(),
        });

        // Send tax settings
        try {
          const taxSettings =
            await this.dynamicTaxConfigService.getTaxSettings();
          client.emit('initial_tax_config_data', {
            taxSettings,
            timestamp: new Date(),
          });
        } catch (error) {
          // Tax settings might not exist yet
          this.logger.debug('No tax settings found for initial data');
        }
      }
    } catch (error) {
      this.logger.error('Error sending initial tax config data', error);
    }
  }

  private canSubscribeToTaxConfig(
    clientInfo: TaxClientInfo,
    subscription: TaxConfigSubscription,
  ): boolean {
    // Admin and super_admin can subscribe to any tax configuration
    if (
      clientInfo.userRole === UserRole.Admin ||
      clientInfo.userRole === UserRole.SuperAdmin
    ) {
      return true;
    }

    // Partners can only subscribe to tax rules that affect them
    if (clientInfo.userRole === UserRole.Partner) {
      return subscription.configTypes.every((type) => type === 'tax_rule');
    }

    return false;
  }

  private canAccessTaxConfig(clientInfo: TaxClientInfo, config: any): boolean {
    // Admin and super_admin can access any tax configuration
    if (
      clientInfo.userRole === UserRole.Admin ||
      clientInfo.userRole === UserRole.SuperAdmin
    ) {
      return true;
    }

    // Partners can access tax rules but not settings
    if (clientInfo.userRole === UserRole.Partner) {
      return config.constructor.name === 'TaxRuleEntity';
    }

    return false;
  }

  private canReceiveTaxConfigUpdate(
    clientInfo: TaxClientInfo,
    event: RealTimeTaxConfigEvent,
  ): boolean {
    return this.canAccessTaxConfig(clientInfo, event.configuration);
  }

  private extractUserIdFromToken(client: Socket): string | null {
    try {
      // Extract user ID from JWT token in authorization header or query
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) {
        return null;
      }

      // This would normally decode the JWT token
      // For now, return a placeholder
      return 'user_id_from_token';
    } catch (error) {
      this.logger.error('Error extracting user ID from token', error);
      return null;
    }
  }

  private extractUserRoleFromToken(client: Socket): UserRole {
    try {
      // Extract user role from JWT token
      // For now, return a default role
      return UserRole.Admin;
    } catch (error) {
      this.logger.error('Error extracting user role from token', error);
      return UserRole.User;
    }
  }

  // Admin methods for monitoring
  getTaxConfigConnectionStats() {
    const stats = {
      totalConnections: this.connectedClients.size,
      connectionsByRole: {} as Record<string, number>,
      totalSubscriptions: this.subscriptions.size,
      subscriptionsByConfig: {} as Record<string, number>,
    };

    for (const clientInfo of this.connectedClients.values()) {
      stats.connectionsByRole[clientInfo.userRole] =
        (stats.connectionsByRole[clientInfo.userRole] || 0) + 1;
    }

    for (const [configId, subscribers] of this.subscriptions.entries()) {
      stats.subscriptionsByConfig[configId] = subscribers.size;
    }

    return stats;
  }

  async cleanupInactiveTaxConfigClients(inactiveThresholdMinutes = 30) {
    const threshold = new Date(
      Date.now() - inactiveThresholdMinutes * 60 * 1000,
    );
    let cleanedUp = 0;

    for (const [socketId, clientInfo] of this.connectedClients.entries()) {
      if (clientInfo.lastActivity < threshold) {
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect();
          cleanedUp++;
        }
      }
    }

    this.logger.log(`Cleaned up ${cleanedUp} inactive tax config clients`);
    return cleanedUp;
  }
}

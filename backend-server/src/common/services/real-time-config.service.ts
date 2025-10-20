import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NotificationGateway } from '../../api/notification/notification.gateway';
import { WebSocketService } from '../../api/notification/services/websocket.service';
import {
  ConfigurationScope,
  ConfigurationType,
} from '../entities/financial-configuration.entity';
import { DynamicFinancialConfigService } from './dynamic-financial-config.service';
import { FinancialConfigIntegrationService } from './financial-config-integration.service';

export interface ConfigurationUpdateEvent {
  type: ConfigurationType;
  scope: ConfigurationScope;
  scopeId?: string;
  oldConfig: any;
  newConfig: any;
  version: number;
  changedBy?: string;
  timestamp: Date;
}

export interface ConfigurationSubscription {
  userId: string;
  configTypes: ConfigurationType[];
  scopes: ConfigurationScope[];
  callback?: (update: ConfigurationUpdateEvent) => void;
}

@Injectable()
export class RealTimeConfigService implements OnModuleInit {
  private readonly logger = new Logger(RealTimeConfigService.name);
  private subscriptions = new Map<string, ConfigurationSubscription>();
  private adminSubscriptions = new Set<string>();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly webSocketService: WebSocketService,
    private readonly notificationGateway: NotificationGateway,
    private readonly dynamicConfigService: DynamicFinancialConfigService,
    private readonly configIntegrationService: FinancialConfigIntegrationService,
  ) {}

  async onModuleInit() {
    this.logger.log('Real-time configuration service initialized');

    // Subscribe to configuration change events
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for configuration changes
   */
  private setupEventListeners(): void {
    // Listen to financial configuration updates
    this.eventEmitter.on(
      'financial.config.updated',
      this.handleConfigurationUpdate.bind(this),
    );
    this.eventEmitter.on(
      'financial.config.commission.changed',
      this.handleCommissionConfigChange.bind(this),
    );
    this.eventEmitter.on(
      'financial.config.tax.changed',
      this.handleTaxConfigChange.bind(this),
    );
    this.eventEmitter.on(
      'financial.config.payment.changed',
      this.handlePaymentConfigChange.bind(this),
    );
    this.eventEmitter.on(
      'financial.config.payout.changed',
      this.handlePayoutConfigChange.bind(this),
    );
  }

  /**
   * Subscribe a user to configuration updates
   */
  async subscribeToConfigUpdates(
    userId: string,
    configTypes: ConfigurationType[] = [],
    scopes: ConfigurationScope[] = [ConfigurationScope.GLOBAL],
    callback?: (update: ConfigurationUpdateEvent) => void,
  ): Promise<void> {
    const subscription: ConfigurationSubscription = {
      userId,
      configTypes:
        configTypes.length > 0 ? configTypes : Object.values(ConfigurationType),
      scopes,
      callback,
    };

    this.subscriptions.set(userId, subscription);

    this.logger.log(`User ${userId} subscribed to configuration updates`, {
      configTypes: subscription.configTypes,
      scopes: subscription.scopes,
    });

    // Send current configuration state
    await this.sendCurrentConfigurationState(userId, subscription);
  }

  /**
   * Subscribe an admin user to all configuration updates
   */
  async subscribeAdminToAllUpdates(adminUserId: string): Promise<void> {
    this.adminSubscriptions.add(adminUserId);

    await this.subscribeToConfigUpdates(
      adminUserId,
      Object.values(ConfigurationType),
      Object.values(ConfigurationScope),
    );

    this.logger.log(
      `Admin user ${adminUserId} subscribed to all configuration updates`,
    );
  }

  /**
   * Unsubscribe a user from configuration updates
   */
  unsubscribeFromConfigUpdates(userId: string): void {
    this.subscriptions.delete(userId);
    this.adminSubscriptions.delete(userId);
    this.logger.log(`User ${userId} unsubscribed from configuration updates`);
  }

  /**
   * Handle configuration update events
   */
  @OnEvent('financial.config.updated')
  private async handleConfigurationUpdate(event: any): Promise<void> {
    const updateEvent: ConfigurationUpdateEvent = {
      type: event.type,
      scope: event.scope,
      scopeId: event.scopeId,
      oldConfig: event.oldConfig,
      newConfig: event.newConfig,
      version: event.version,
      changedBy: event.changedBy,
      timestamp: new Date(),
    };

    await this.broadcastConfigurationUpdate(updateEvent);
  }

  /**
   * Handle commission configuration changes
   */
  private async handleCommissionConfigChange(event: any): Promise<void> {
    const updateEvent: ConfigurationUpdateEvent = {
      type: ConfigurationType.COMMISSION_SETTINGS,
      scope: ConfigurationScope.GLOBAL,
      oldConfig: null,
      newConfig: event.config,
      version: 1,
      changedBy: 'system',
      timestamp: event.timestamp,
    };

    await this.broadcastConfigurationUpdate(updateEvent);
  }

  /**
   * Handle tax configuration changes
   */
  private async handleTaxConfigChange(event: any): Promise<void> {
    const updateEvent: ConfigurationUpdateEvent = {
      type: ConfigurationType.TAX_SETTINGS,
      scope: ConfigurationScope.GLOBAL,
      oldConfig: null,
      newConfig: event.config,
      version: 1,
      changedBy: 'system',
      timestamp: event.timestamp,
    };

    await this.broadcastConfigurationUpdate(updateEvent);
  }

  /**
   * Handle payment configuration changes
   */
  private async handlePaymentConfigChange(event: any): Promise<void> {
    const updateEvent: ConfigurationUpdateEvent = {
      type: ConfigurationType.PAYMENT_SETTINGS,
      scope: ConfigurationScope.GLOBAL,
      oldConfig: null,
      newConfig: event.config,
      version: 1,
      changedBy: 'system',
      timestamp: event.timestamp,
    };

    await this.broadcastConfigurationUpdate(updateEvent);
  }

  /**
   * Handle payout configuration changes
   */
  private async handlePayoutConfigChange(event: any): Promise<void> {
    const updateEvent: ConfigurationUpdateEvent = {
      type: ConfigurationType.PAYOUT_SETTINGS,
      scope: ConfigurationScope.GLOBAL,
      oldConfig: null,
      newConfig: event.config,
      version: 1,
      changedBy: 'system',
      timestamp: event.timestamp,
    };

    await this.broadcastConfigurationUpdate(updateEvent);
  }

  /**
   * Broadcast configuration update to subscribed users
   */
  private async broadcastConfigurationUpdate(
    updateEvent: ConfigurationUpdateEvent,
  ): Promise<void> {
    const relevantSubscriptions = this.getRelevantSubscriptions(updateEvent);

    for (const [userId, subscription] of relevantSubscriptions) {
      try {
        // Call custom callback if provided
        if (subscription.callback) {
          subscription.callback(updateEvent);
        }

        // Send real-time update via WebSocket
        await this.sendConfigurationUpdate(userId, updateEvent);

        this.logger.debug(`Configuration update sent to user ${userId}`, {
          type: updateEvent.type,
          scope: updateEvent.scope,
          version: updateEvent.version,
        });
      } catch (error) {
        this.logger.error(
          `Failed to send configuration update to user ${userId}`,
          error,
        );
      }
    }

    // Broadcast to admin users
    await this.broadcastToAdmins(updateEvent);
  }

  /**
   * Get subscriptions relevant to a configuration update
   */
  private getRelevantSubscriptions(
    updateEvent: ConfigurationUpdateEvent,
  ): Map<string, ConfigurationSubscription> {
    const relevantSubscriptions = new Map<string, ConfigurationSubscription>();

    for (const [userId, subscription] of this.subscriptions) {
      const isTypeRelevant = subscription.configTypes.includes(
        updateEvent.type,
      );
      const isScopeRelevant = subscription.scopes.includes(updateEvent.scope);

      if (isTypeRelevant && isScopeRelevant) {
        relevantSubscriptions.set(userId, subscription);
      }
    }

    return relevantSubscriptions;
  }

  /**
   * Send configuration update to a specific user
   */
  private async sendConfigurationUpdate(
    userId: string,
    updateEvent: ConfigurationUpdateEvent,
  ): Promise<void> {
    await this.webSocketService.sendToUser(userId, {
      type: 'configuration_update',
      data: {
        configType: updateEvent.type,
        scope: updateEvent.scope,
        scopeId: updateEvent.scopeId,
        configuration: updateEvent.newConfig,
        version: updateEvent.version,
        changedBy: updateEvent.changedBy,
        timestamp: updateEvent.timestamp,
        changes: this.calculateConfigurationChanges(
          updateEvent.oldConfig,
          updateEvent.newConfig,
        ),
      },
    });
  }

  /**
   * Broadcast configuration update to all admin users
   */
  private async broadcastToAdmins(
    updateEvent: ConfigurationUpdateEvent,
  ): Promise<void> {
    for (const adminUserId of this.adminSubscriptions) {
      try {
        await this.sendConfigurationUpdate(adminUserId, updateEvent);

        // Send additional admin-specific notification
        await this.webSocketService.sendToUser(adminUserId, {
          type: 'admin_configuration_alert',
          data: {
            message: `Configuration updated: ${updateEvent.type}`,
            configType: updateEvent.type,
            scope: updateEvent.scope,
            changedBy: updateEvent.changedBy,
            timestamp: updateEvent.timestamp,
            priority: 'medium',
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to send admin configuration update to ${adminUserId}`,
          error,
        );
      }
    }
  }

  /**
   * Send current configuration state to a user
   */
  private async sendCurrentConfigurationState(
    userId: string,
    subscription: ConfigurationSubscription,
  ): Promise<void> {
    try {
      const currentConfigurations = {};

      for (const configType of subscription.configTypes) {
        for (const scope of subscription.scopes) {
          try {
            const config = await this.dynamicConfigService.getConfiguration(
              configType,
              scope,
            );
            const key = `${configType}_${scope}`;
            currentConfigurations[key] = config;
          } catch (error) {
            this.logger.warn(
              `Failed to get current configuration for ${configType}:${scope}`,
              error,
            );
          }
        }
      }

      await this.webSocketService.sendToUser(userId, {
        type: 'configuration_state',
        data: {
          configurations: currentConfigurations,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send current configuration state to user ${userId}`,
        error,
      );
    }
  }

  /**
   * Calculate changes between old and new configuration
   */
  private calculateConfigurationChanges(oldConfig: any, newConfig: any): any {
    if (!oldConfig) return { type: 'created', changes: newConfig };

    const changes = {};
    const allKeys = new Set([
      ...Object.keys(oldConfig || {}),
      ...Object.keys(newConfig || {}),
    ]);

    for (const key of allKeys) {
      const oldValue = oldConfig?.[key];
      const newValue = newConfig?.[key];

      if (oldValue !== newValue) {
        changes[key] = {
          from: oldValue,
          to: newValue,
        };
      }
    }

    return {
      type: Object.keys(changes).length > 0 ? 'updated' : 'no_change',
      changes,
    };
  }

  /**
   * Force refresh configuration for all subscribers
   */
  async forceRefreshConfiguration(): Promise<void> {
    this.logger.log('Force refreshing configuration for all subscribers');

    for (const [userId, subscription] of this.subscriptions) {
      await this.sendCurrentConfigurationState(userId, subscription);
    }
  }

  /**
   * Get subscription statistics
   */
  getSubscriptionStats(): any {
    return {
      totalSubscriptions: this.subscriptions.size,
      adminSubscriptions: this.adminSubscriptions.size,
      subscriptionsByType: this.getSubscriptionsByType(),
      subscriptionsByScope: this.getSubscriptionsByScope(),
    };
  }

  /**
   * Get subscriptions grouped by configuration type
   */
  private getSubscriptionsByType(): Record<string, number> {
    const stats = {};

    for (const configType of Object.values(ConfigurationType)) {
      stats[configType] = 0;
    }

    for (const subscription of this.subscriptions.values()) {
      for (const configType of subscription.configTypes) {
        stats[configType] = (stats[configType] || 0) + 1;
      }
    }

    return stats;
  }

  /**
   * Get subscriptions grouped by scope
   */
  private getSubscriptionsByScope(): Record<string, number> {
    const stats = {};

    for (const scope of Object.values(ConfigurationScope)) {
      stats[scope] = 0;
    }

    for (const subscription of this.subscriptions.values()) {
      for (const scope of subscription.scopes) {
        stats[scope] = (stats[scope] || 0) + 1;
      }
    }

    return stats;
  }
}

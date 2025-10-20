import { UserEntity } from '@/auth/entities/user.entity';
import { EntityType, IdGeneratorService } from '@/utils/id-generator.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export enum AuditAction {
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_STATUS_CHANGED = 'user_status_changed',
  SPACE_CREATED = 'space_created',
  SPACE_UPDATED = 'space_updated',
  SPACE_DELETED = 'space_deleted',
  SPACE_STATUS_CHANGED = 'space_status_changed',
  SPACE_APPROVED = 'space_approved',
  SPACE_REJECTED = 'space_rejected',
  BOOKING_UPDATED = 'booking_updated',
  BOOKING_STATUS_UPDATED = 'booking_status_updated',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_REFUNDED = 'booking_refunded',
  BOOKING_EXTENDED = 'booking_extended',
}

export interface AuditLogEntry {
  id?: string;
  action: AuditAction;
  adminId: string;
  targetUserId?: string;
  targetSpaceId?: string;
  targetBookingId?: string;
  oldData?: any;
  newData?: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private auditLogs: AuditLogEntry[] = [];

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private idGeneratorService: IdGeneratorService,
  ) {}

  async logAction(auditData: {
    action: AuditAction;
    adminId: string;
    targetUserId?: string;
    targetSpaceId?: string;
    targetBookingId?: string;
    oldData?: any;
    newData?: any;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        id: this.idGeneratorService.generateId(EntityType.AUDIT),
        ...auditData,
      };

      this.auditLogs.push(auditEntry);
      console.log('AUDIT LOG:', JSON.stringify(auditEntry, null, 2));
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }

  async logUserAction(
    action: AuditAction,
    targetUserId: string,
    performedBy: string,
    details: Record<string, any> = {},
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<void> {
    try {
      // Get performer details
      const performer = await this.userRepository.findOne({
        where: { id: performedBy },
        select: ['id', 'firstName', 'lastName', 'email'],
      });

      const auditEntry: AuditLogEntry = {
        id: this.idGeneratorService.generateId(EntityType.AUDIT),
        action,
        adminId: performedBy,
        targetUserId,
        oldData: details,
        timestamp: new Date(),
      };

      // Add metadata if available
      if (metadata?.ipAddress) auditEntry.ipAddress = metadata.ipAddress;
      if (metadata?.userAgent) auditEntry.userAgent = metadata.userAgent;

      // In a real implementation, this would be saved to a database
      // For now, we'll store in memory and log to console
      this.auditLogs.push(auditEntry);

      console.log('AUDIT LOG:', JSON.stringify(auditEntry, null, 2));
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }

  async getUserAuditLogs(
    userId: string,
    limit: number = 50,
  ): Promise<AuditLogEntry[]> {
    return this.auditLogs
      .filter((log) => log.targetUserId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getAdminAuditLogs(
    adminId?: string,
    limit: number = 100,
  ): Promise<AuditLogEntry[]> {
    let logs = this.auditLogs;

    if (adminId) {
      logs = logs.filter((log) => log.adminId === adminId);
    }

    return logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getAuditStats(): Promise<{
    totalActions: number;
    actionsByType: Record<AuditAction, number>;
    recentActivity: AuditLogEntry[];
  }> {
    const actionsByType = {} as Record<AuditAction, number>;

    // Initialize all action types
    Object.values(AuditAction).forEach((action) => {
      actionsByType[action] = 0;
    });

    // Count actions
    this.auditLogs.forEach((log) => {
      actionsByType[log.action]++;
    });

    const recentActivity = this.auditLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      totalActions: this.auditLogs.length,
      actionsByType,
      recentActivity,
    };
  }
}

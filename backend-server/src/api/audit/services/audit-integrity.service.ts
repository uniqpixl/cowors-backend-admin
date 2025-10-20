import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../entities/audit-log.entity';

export interface AuditLogContent {
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  description?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity: string;
  metadata?: Record<string, any>;
  sessionId?: string;
  requestId?: string;
  endpoint?: string;
  httpMethod?: string;
  responseStatus?: number;
  executionTime?: number;
  isSuccessful: boolean;
  errorMessage?: string;
  createdAt: Date;
}

@Injectable()
export class AuditIntegrityService {
  private readonly logger = new Logger(AuditIntegrityService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  /**
   * Generate SHA-256 hash of audit log content
   */
  generateContentHash(content: AuditLogContent): string {
    // Create a deterministic string representation of the content
    const contentString = JSON.stringify(content, Object.keys(content).sort());
    return crypto
      .createHash('sha256')
      .update(contentString, 'utf8')
      .digest('hex');
  }

  /**
   * Get the hash of the previous audit log for chain integrity
   */
  async getPreviousHash(): Promise<{
    hash: string;
    sequenceNumber: number;
  } | null> {
    try {
      const lastLog = await this.auditLogRepository.findOne({
        where: {},
        order: { sequenceNumber: 'DESC' },
        select: ['contentHash', 'sequenceNumber'],
      });

      if (!lastLog) {
        return null;
      }

      return {
        hash: lastLog.contentHash,
        sequenceNumber: lastLog.sequenceNumber || 0,
      };
    } catch (error) {
      this.logger.error('Failed to get previous hash', error.stack);
      return null;
    }
  }

  /**
   * Generate integrity data for a new audit log
   */
  async generateIntegrityData(content: AuditLogContent): Promise<{
    contentHash: string;
    previousHash: string | null;
    sequenceNumber: number;
    hashAlgorithm: string;
  }> {
    const contentHash = this.generateContentHash(content);
    const previousData = await this.getPreviousHash();

    return {
      contentHash,
      previousHash: previousData?.hash || null,
      sequenceNumber: (previousData?.sequenceNumber || 0) + 1,
      hashAlgorithm: 'SHA256',
    };
  }

  /**
   * Verify the integrity of a single audit log
   */
  verifyLogIntegrity(log: AuditLogEntity): boolean {
    try {
      const content: AuditLogContent = {
        userId: log.userId,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        description: log.description,
        oldValues: log.oldValues,
        newValues: log.newValues,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        severity: log.severity,
        metadata: log.metadata,
        sessionId: log.sessionId,
        requestId: log.requestId,
        endpoint: log.endpoint,
        httpMethod: log.httpMethod,
        responseStatus: log.responseStatus,
        executionTime: log.executionTime,
        isSuccessful: log.isSuccessful,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt,
      };

      const expectedHash = this.generateContentHash(content);
      return expectedHash === log.contentHash;
    } catch (error) {
      this.logger.error(
        `Failed to verify log integrity for ${log.id}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Verify the chain integrity of audit logs
   */
  async verifyChainIntegrity(limit: number = 100): Promise<{
    isValid: boolean;
    totalChecked: number;
    invalidLogs: string[];
    brokenChainAt?: number;
  }> {
    try {
      const logs = await this.auditLogRepository.find({
        order: { sequenceNumber: 'ASC' },
        take: limit,
      });

      const invalidLogs: string[] = [];
      let brokenChainAt: number | undefined;
      let previousHash: string | null = null;

      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];

        // Verify content hash
        if (!this.verifyLogIntegrity(log)) {
          invalidLogs.push(log.id);
        }

        // Verify chain integrity
        if (i === 0) {
          // First log should have null previous hash
          if (log.previousHash !== null) {
            brokenChainAt = log.sequenceNumber;
          }
        } else {
          // Subsequent logs should reference the previous log's hash
          if (log.previousHash !== previousHash) {
            brokenChainAt = log.sequenceNumber;
          }
        }

        previousHash = log.contentHash;
      }

      return {
        isValid: invalidLogs.length === 0 && brokenChainAt === undefined,
        totalChecked: logs.length,
        invalidLogs,
        brokenChainAt,
      };
    } catch (error) {
      this.logger.error('Failed to verify chain integrity', error.stack);
      return {
        isValid: false,
        totalChecked: 0,
        invalidLogs: [],
      };
    }
  }

  /**
   * Mark audit logs as integrity verified
   */
  async markAsVerified(logIds: string[]): Promise<void> {
    try {
      await this.auditLogRepository.update(
        { id: { $in: logIds } as any },
        { integrityVerified: true },
      );
    } catch (error) {
      this.logger.error('Failed to mark logs as verified', error.stack);
    }
  }

  /**
   * Get integrity statistics
   */
  async getIntegrityStatistics(): Promise<{
    totalLogs: number;
    verifiedLogs: number;
    unverifiedLogs: number;
    lastVerificationDate?: Date;
  }> {
    try {
      const [totalLogs, verifiedLogs] = await Promise.all([
        this.auditLogRepository.count(),
        this.auditLogRepository.count({ where: { integrityVerified: true } }),
      ]);

      const lastVerified = await this.auditLogRepository.findOne({
        where: { integrityVerified: true },
        order: { createdAt: 'DESC' },
        select: ['createdAt'],
      });

      return {
        totalLogs,
        verifiedLogs,
        unverifiedLogs: totalLogs - verifiedLogs,
        lastVerificationDate: lastVerified?.createdAt,
      };
    } catch (error) {
      this.logger.error('Failed to get integrity statistics', error.stack);
      return {
        totalLogs: 0,
        verifiedLogs: 0,
        unverifiedLogs: 0,
      };
    }
  }
}

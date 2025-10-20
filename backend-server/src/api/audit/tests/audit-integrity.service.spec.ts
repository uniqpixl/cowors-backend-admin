import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuditAction,
  AuditLogEntity,
  AuditSeverity,
} from '../entities/audit-log.entity';
import { AuditIntegrityService } from '../services/audit-integrity.service';

describe('AuditIntegrityService', () => {
  let service: AuditIntegrityService;
  let repository: jest.Mocked<Repository<AuditLogEntity>>;

  const mockAuditLog = {
    id: '1',
    userId: 'user-1',
    action: AuditAction.CREATE,
    resourceType: 'USER',
    resourceId: 'resource-1',
    description: null,
    oldValues: null,
    newValues: null,
    metadata: { test: 'data' },
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    severity: AuditSeverity.LOW,
    sessionId: null,
    requestId: null,
    endpoint: null,
    httpMethod: null,
    responseStatus: null,
    executionTime: null,
    isSuccessful: true,
    errorMessage: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    contentHash: '', // Will be set dynamically
    previousHash: null,
    sequenceNumber: 1,
    hashAlgorithm: 'SHA256',
    integrityVerified: false,
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      })),
    };

    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditIntegrityService,
        {
          provide: getRepositoryToken(AuditLogEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuditIntegrityService>(AuditIntegrityService);
    repository = module.get(getRepositoryToken(AuditLogEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateContentHash', () => {
    it('should generate consistent hash for same content', () => {
      const content = {
        userId: 'user-1',
        action: AuditAction.CREATE,
        resourceType: 'USER',
        resourceId: 'resource-1',
        metadata: { test: 'data' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        severity: AuditSeverity.LOW,
        isSuccessful: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };

      const hash1 = service.generateContentHash(content);
      const hash2 = service.generateContentHash(content);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate different hashes for different content', () => {
      const content1 = {
        userId: 'user-1',
        action: AuditAction.CREATE,
        resourceType: 'USER',
        resourceId: 'resource-1',
        metadata: { test: 'data' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        severity: AuditSeverity.LOW,
        isSuccessful: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };

      const content2 = {
        userId: 'user-2',
        action: AuditAction.UPDATE,
        resourceType: 'POST',
        resourceId: 'resource-2',
        metadata: { test: 'different-data' },
        ipAddress: '192.168.1.1',
        userAgent: 'different-agent',
        severity: AuditSeverity.HIGH,
        isSuccessful: false,
        createdAt: new Date('2024-01-02T00:00:00Z'),
      };

      const hash1 = service.generateContentHash(content1);
      const hash2 = service.generateContentHash(content2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('getPreviousHash', () => {
    it('should return null for first audit log', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.getPreviousHash();

      expect(result).toBeNull();
    });

    it('should return previous hash when audit logs exist', async () => {
      const mockLog = {
        contentHash: 'previous-hash',
        sequenceNumber: 5,
      } as Partial<AuditLogEntity>;
      repository.findOne.mockResolvedValue(mockLog as AuditLogEntity);

      const result = await service.getPreviousHash();

      expect(result).toEqual({
        hash: 'previous-hash',
        sequenceNumber: 5,
      });
    });
  });

  describe('generateIntegrityData', () => {
    it('should generate integrity data for first audit log', async () => {
      repository.findOne.mockResolvedValue(null);

      const content = {
        userId: 'user-1',
        action: AuditAction.CREATE,
        resourceType: 'USER',
        resourceId: 'resource-1',
        metadata: { test: 'data' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        severity: AuditSeverity.LOW,
        isSuccessful: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };

      const result = await service.generateIntegrityData(content);

      expect(result.previousHash).toBeNull();
      expect(result.sequenceNumber).toBe(1);
      expect(result.hashAlgorithm).toBe('SHA256');
      expect(result.contentHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate integrity data with previous hash for subsequent logs', async () => {
      const mockLog = {
        contentHash: 'previous-hash',
        sequenceNumber: 5,
      } as Partial<AuditLogEntity>;
      repository.findOne.mockResolvedValue(mockLog as AuditLogEntity);

      const content = {
        userId: 'user-1',
        action: AuditAction.CREATE,
        resourceType: 'USER',
        resourceId: 'resource-1',
        metadata: { test: 'data' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        severity: AuditSeverity.LOW,
        isSuccessful: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };

      const result = await service.generateIntegrityData(content);

      expect(result.previousHash).toBe('previous-hash');
      expect(result.sequenceNumber).toBe(6);
      expect(result.hashAlgorithm).toBe('SHA256');
      expect(result.contentHash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('verifyLogIntegrity', () => {
    it('should verify log integrity successfully', () => {
      // Generate the correct content hash for the mock log
      const content = {
        userId: mockAuditLog.userId,
        action: mockAuditLog.action,
        resourceType: mockAuditLog.resourceType,
        resourceId: mockAuditLog.resourceId,
        description: mockAuditLog.description,
        oldValues: mockAuditLog.oldValues,
        newValues: mockAuditLog.newValues,
        ipAddress: mockAuditLog.ipAddress,
        userAgent: mockAuditLog.userAgent,
        severity: mockAuditLog.severity,
        metadata: mockAuditLog.metadata,
        sessionId: mockAuditLog.sessionId,
        requestId: mockAuditLog.requestId,
        endpoint: mockAuditLog.endpoint,
        httpMethod: mockAuditLog.httpMethod,
        responseStatus: mockAuditLog.responseStatus,
        executionTime: mockAuditLog.executionTime,
        isSuccessful: mockAuditLog.isSuccessful,
        errorMessage: mockAuditLog.errorMessage,
        createdAt: mockAuditLog.createdAt,
      };
      const correctHash = service.generateContentHash(content);
      const testLog = {
        ...mockAuditLog,
        contentHash: correctHash,
        user: { id: 'user-1' } as any,
      };

      const result = service.verifyLogIntegrity(testLog as AuditLogEntity);

      expect(result).toBe(true);
    });

    it('should detect content hash mismatch', () => {
      const invalidLog = {
        ...mockAuditLog,
        contentHash: 'invalid-hash',
        user: { id: 'user-1' } as any,
      };

      const result = service.verifyLogIntegrity(invalidLog as AuditLogEntity);

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', () => {
      const invalidLog = {
        ...mockAuditLog,
        userId: null, // This will cause an error in content generation
        user: { id: 'user-1' } as any,
      };

      const result = service.verifyLogIntegrity(invalidLog as AuditLogEntity);

      expect(result).toBe(false);
    });
  });

  describe('verifyChainIntegrity', () => {
    it('should verify chain integrity successfully', async () => {
      // Create first log with correct hash
      const content1 = {
        userId: 'user-1',
        action: AuditAction.CREATE,
        resourceType: 'USER',
        resourceId: 'resource-1',
        description: null,
        oldValues: null,
        newValues: null,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        severity: AuditSeverity.LOW,
        metadata: { test: 'data' },
        sessionId: null,
        requestId: null,
        endpoint: null,
        httpMethod: null,
        responseStatus: null,
        executionTime: null,
        isSuccessful: true,
        errorMessage: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };
      const hash1 = service.generateContentHash(content1);

      const content2 = {
        ...content1,
        resourceId: 'resource-2',
        createdAt: new Date('2024-01-01T01:00:00Z'),
      };
      const hash2 = service.generateContentHash(content2);

      const logs = [
        {
          ...mockAuditLog,
          id: '1',
          sequenceNumber: 1,
          previousHash: null,
          contentHash: hash1,
          user: { id: 'user-1' } as any,
        },
        {
          ...mockAuditLog,
          id: '2',
          resourceId: 'resource-2',
          sequenceNumber: 2,
          previousHash: hash1,
          contentHash: hash2,
          createdAt: new Date('2024-01-01T01:00:00Z'),
          user: { id: 'user-1' } as any,
        },
      ];
      repository.find.mockResolvedValue(logs as AuditLogEntity[]);

      const result = await service.verifyChainIntegrity();

      expect(result.isValid).toBe(true);
      expect(result.totalChecked).toBe(2);
      expect(result.totalChecked - result.invalidLogs.length).toBe(2);
      expect(result.invalidLogs).toEqual([]);
    });

    it('should detect chain break', async () => {
      // Create first log with correct hash
      const content1 = {
        userId: 'user-1',
        action: AuditAction.CREATE,
        resourceType: 'USER',
        resourceId: 'resource-1',
        description: null,
        oldValues: null,
        newValues: null,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        severity: AuditSeverity.LOW,
        metadata: { test: 'data' },
        sessionId: null,
        requestId: null,
        endpoint: null,
        httpMethod: null,
        responseStatus: null,
        executionTime: null,
        isSuccessful: true,
        errorMessage: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };
      const hash1 = service.generateContentHash(content1);

      const content2 = {
        ...content1,
        resourceId: 'resource-2',
        createdAt: new Date('2024-01-01T01:00:00Z'),
      };
      const hash2 = service.generateContentHash(content2);

      const logs = [
        {
          ...mockAuditLog,
          id: '1',
          sequenceNumber: 1,
          previousHash: null,
          contentHash: hash1,
          user: { id: 'user-1' } as any,
        },
        {
          ...mockAuditLog,
          id: '2',
          resourceId: 'resource-2',
          sequenceNumber: 2,
          previousHash: 'wrong-hash', // This will cause chain break
          contentHash: hash2,
          createdAt: new Date('2024-01-01T01:00:00Z'),
          user: { id: 'user-1' } as any,
        },
      ];
      repository.find.mockResolvedValue(logs as AuditLogEntity[]);

      const result = await service.verifyChainIntegrity();

      expect(result.isValid).toBe(false);
      expect(result.totalChecked).toBe(2);
      expect(result.brokenChainAt).toBe(2);
      expect(result.invalidLogs).toEqual([]);
    });
  });

  describe('getIntegrityStatistics', () => {
    it('should return integrity statistics', async () => {
      repository.count.mockImplementation((options: any) => {
        if (options?.where?.integrityVerified === true)
          return Promise.resolve(8);
        if (options?.where?.integrityVerified === false)
          return Promise.resolve(2);
        return Promise.resolve(10);
      });

      const result = await service.getIntegrityStatistics();

      expect(result.totalLogs).toBe(10);
      expect(result.verifiedLogs).toBe(8);
      expect(result.unverifiedLogs).toBe(2);
    });
  });

  describe('markAsVerified', () => {
    it('should mark logs as verified', async () => {
      const logIds = ['log1', 'log2'];
      repository.update.mockResolvedValue({
        affected: 2,
        raw: [],
        generatedMaps: [],
      });

      await service.markAsVerified(logIds);

      expect(repository.update).toHaveBeenCalledWith(
        { id: { $in: logIds } },
        { integrityVerified: true },
      );
    });

    it('should handle errors when marking logs as verified', async () => {
      const logIds = ['log1'];
      repository.update.mockRejectedValue(new Error('Database error'));

      // Should not throw error, just log it
      await expect(service.markAsVerified(logIds)).resolves.not.toThrow();
    });
  });
});

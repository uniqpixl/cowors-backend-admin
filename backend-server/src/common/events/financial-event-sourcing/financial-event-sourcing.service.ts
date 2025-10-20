import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';

import {
  AggregateStatus,
  AggregateType,
  FinancialAggregateEntity,
} from './financial-aggregate.entity';
import {
  FinancialEventEntity,
  FinancialEventStatus,
  FinancialEventType,
} from './financial-event.entity';

export interface FinancialEventData {
  aggregateId: string;
  aggregateType: AggregateType;
  eventType: FinancialEventType;
  eventData: Record<string, any>;
  metadata?: Record<string, any>;
  userId?: string;
  partnerId?: string;
  bookingId?: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  correlationId?: string;
  causationId?: string;
}

export interface EventReplayOptions {
  fromVersion?: number;
  toVersion?: number;
  fromTimestamp?: Date;
  toTimestamp?: Date;
  eventTypes?: FinancialEventType[];
  includeMetadata?: boolean;
  stopOnError?: boolean;
  validateState?: boolean;
  includeProjections?: boolean;
  projections?: EventProjection[];
  parallelProcessing?: boolean;
  batchSize?: number;
  includeSnapshots?: boolean;
  validateBusinessRules?: boolean;
  dryRun?: boolean;
  includePerformanceMetrics?: boolean;
}

export interface StateReconstructionOptions {
  aggregateId: string;
  targetVersion?: number;
  targetTimestamp?: Date;
  includeSnapshots?: boolean;
  validateConsistency?: boolean;
  includeProjections?: boolean;
}

export interface EventProjection {
  name: string;
  apply: (state: any, event: FinancialEventEntity) => any;
  initialState?: any;
}

export interface ReplayResult {
  finalState: Record<string, any>;
  eventsProcessed: number;
  errors: Array<{ eventId: string; error: string; version: number }>;
  projections?: Record<string, any>;
  metadata: {
    startTime: Date;
    endTime: Date;
    duration: number;
    fromVersion?: number;
    toVersion?: number;
  };
  performanceMetrics?: {
    eventsPerSecond: number;
    averageEventProcessingTime: number;
    memoryUsage: number;
    peakMemoryUsage: number;
  };
  validationResults?: {
    businessRuleViolations: Array<{
      eventId: string;
      rule: string;
      violation: string;
    }>;
    stateConsistencyChecks: {
      passed: number;
      failed: number;
      details: Array<{
        check: string;
        result: boolean;
        message?: string;
      }>;
    };
  };
}

export interface AdvancedReplayOptions extends EventReplayOptions {
  checkpoints?: number[]; // Version numbers to create checkpoints
  rollbackOnError?: boolean;
  includeIntermediateStates?: boolean;
  customValidators?: Array<{
    name: string;
    validate: (state: any, event: FinancialEventEntity) => boolean;
    errorMessage: string;
  }>;
  progressCallback?: (progress: {
    processed: number;
    total: number;
    currentEvent: FinancialEventEntity;
    currentState: any;
  }) => void;
}

export interface ReplayCheckpoint {
  version: number;
  state: Record<string, any>;
  timestamp: Date;
  eventId: string;
  projections?: Record<string, any>;
}

export interface ParallelReplayOptions {
  aggregateIds: string[];
  maxConcurrency?: number;
  sharedProjections?: EventProjection[];
  consolidateResults?: boolean;
  failFast?: boolean;
}

export interface AuditTrailOptions {
  userId?: string;
  partnerId?: string;
  transactionId?: string;
  fromDate?: Date;
  toDate?: Date;
  eventTypes?: FinancialEventType[];
  includeStateChanges?: boolean;
  limit?: number;
  offset?: number;
  // Enhanced audit trail options
  includeMetadata?: boolean;
  includeUserDetails?: boolean;
  includeSystemEvents?: boolean;
  aggregateIds?: string[];
  aggregateType?: AggregateType;
  correlationId?: string;
  causationId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  includeFailedEvents?: boolean;
  groupByAggregate?: boolean;
  sortBy?: 'timestamp' | 'eventType' | 'aggregateId' | 'severity';
  sortOrder?: 'asc' | 'desc';
  tags?: string[];
}

export interface EnhancedAuditTrailEntry {
  eventId: string;
  aggregateId: string;
  aggregateType: AggregateType;
  eventType: FinancialEventType;
  eventData: Record<string, any>;
  metadata: {
    timestamp: Date;
    version: number;
    userId?: string;
    partnerId?: string;
    transactionId?: string;
    correlationId?: string;
    causationId?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    requestId?: string;
    source: 'api' | 'system' | 'migration' | 'replay';
    severity: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
  };
  stateChange?: {
    previousState: any;
    newState: any;
    changedFields: string[];
    changeType: 'create' | 'update' | 'delete' | 'restore';
    impactLevel: 'minor' | 'moderate' | 'major' | 'critical';
  };
  userDetails?: {
    userId: string;
    username?: string;
    email?: string;
    role?: string;
    permissions?: string[];
  };
  validationResults?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  processingInfo?: {
    processingTime: number;
    retryCount: number;
    status: FinancialEventStatus;
    errorMessage?: string;
  };
}

export interface AuditTrailSummary {
  totalEvents: number;
  eventsByType: Record<FinancialEventType, number>;
  eventsByStatus: Record<FinancialEventStatus, number>;
  eventsBySeverity: Record<string, number>;
  uniqueUsers: number;
  uniqueAggregates: number;
  dateRange: {
    earliest: Date;
    latest: Date;
  };
  topUsers: Array<{
    userId: string;
    eventCount: number;
    lastActivity: Date;
  }>;
  topAggregates: Array<{
    aggregateId: string;
    aggregateType: AggregateType;
    eventCount: number;
    lastModified: Date;
  }>;
  errorSummary: {
    totalErrors: number;
    errorsByType: Record<string, number>;
    criticalErrors: number;
  };
}

export interface ComplianceAuditOptions {
  complianceStandard: 'SOX' | 'PCI_DSS' | 'GDPR' | 'CUSTOM';
  includeDataAccess?: boolean;
  includeDataModification?: boolean;
  includeUserActions?: boolean;
  includeSystemActions?: boolean;
  includeFailedAttempts?: boolean;
  maskSensitiveData?: boolean;
  includeRetentionInfo?: boolean;
}

export interface ComplianceAuditReport {
  reportId: string;
  standard: string;
  generatedAt: Date;
  generatedBy: string;
  period: {
    from: Date;
    to: Date;
  };
  summary: AuditTrailSummary;
  findings: Array<{
    type: 'violation' | 'warning' | 'info';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    eventIds: string[];
    recommendation?: string;
    complianceRule: string;
  }>;
  dataIntegrity: {
    totalRecords: number;
    verifiedRecords: number;
    corruptedRecords: number;
    missingRecords: number;
    integrityScore: number; // 0-100
  };
  retentionCompliance: {
    recordsWithinRetention: number;
    recordsExpired: number;
    recordsToBeArchived: number;
    retentionScore: number; // 0-100
  };
  recommendations: string[];
}

export interface EventMigrationOptions {
  fromVersion: number;
  toVersion: number;
  migrationRules: EventMigrationRule[];
  dryRun?: boolean;
  batchSize?: number;
  eventTypes?: FinancialEventType[];
  aggregateIds?: string[];
  validationRules?: Array<{
    name: string;
    validate: (eventData: any) => boolean;
    errorMessage: string;
  }>;
  targetSchemaVersion?: number;
  stopOnError?: boolean;
  preserveOriginal?: boolean;
}

export interface EventMigrationRule {
  eventType: FinancialEventType;
  transform: (eventData: any) => any;
  conditions?: (eventData: any) => boolean;
  name?: string;
  apply?: (event: FinancialEventEntity) => Promise<FinancialEventEntity>;
  required?: boolean;
}

export interface SnapshotOptions {
  aggregateId: string;
  atVersion?: number;
  atTimestamp?: Date;
}

export interface EventVersioningOptions {
  eventType: FinancialEventType;
  fromSchemaVersion: number;
  toSchemaVersion: number;
  migrationStrategy: 'immediate' | 'lazy' | 'background';
  backupOriginal?: boolean;
}

export interface EventSchemaVersion {
  eventType: FinancialEventType;
  version: number;
  schema: Record<string, any>;
  migrationRules?: EventMigrationRule[];
  deprecatedFields?: string[];
  requiredFields?: string[];
}

export interface MigrationResult {
  migratedCount: number;
  skippedCount: number;
  errors: Array<{ eventId: string; error: string; version: number }>;
  backupCreated?: boolean;
  migrationTime: number;
  affectedAggregates: string[];
}

export interface EventVersionRegistry {
  [eventType: string]: {
    currentVersion: number;
    versions: EventSchemaVersion[];
    migrationPath: Array<{
      from: number;
      to: number;
      migrationRule: EventMigrationRule;
    }>;
  };
}

@Injectable()
export class FinancialEventSourcingService {
  private readonly logger = new Logger(FinancialEventSourcingService.name);
  private eventVersionRegistry: EventVersionRegistry = {};

  constructor(
    @InjectRepository(FinancialEventEntity)
    private readonly eventRepository: Repository<FinancialEventEntity>,
    @InjectRepository(FinancialAggregateEntity)
    private readonly aggregateRepository: Repository<FinancialAggregateEntity>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Store a financial event and update aggregate state
   */
  async storeEvent(
    eventData: FinancialEventData,
  ): Promise<FinancialEventEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get or create aggregate
      let aggregate = await queryRunner.manager.findOne(
        FinancialAggregateEntity,
        {
          where: { id: eventData.aggregateId },
        },
      );

      if (!aggregate) {
        aggregate = queryRunner.manager.create(FinancialAggregateEntity, {
          id: eventData.aggregateId,
          aggregateType: eventData.aggregateType,
          currentState: {},
          lastEventVersion: 0,
          status: AggregateStatus.ACTIVE,
          userId: eventData.userId,
          partnerId: eventData.partnerId,
          bookingId: eventData.bookingId,
          metadata: eventData.metadata || {},
        });
        await queryRunner.manager.save(aggregate);
      }

      // Create and save event
      const event = queryRunner.manager.create(FinancialEventEntity, {
        ...eventData,
        version: aggregate.lastEventVersion + 1,
        status: FinancialEventStatus.PENDING,
      });

      await queryRunner.manager.save(event);

      // Update aggregate state
      const newState = this.applyEventToState(aggregate.currentState, event);
      aggregate.currentState = newState;
      aggregate.lastEventVersion = event.version;

      await queryRunner.manager.save(aggregate);

      await queryRunner.commitTransaction();

      // Emit event for other services
      this.eventEmitter.emit('financial.event.stored', {
        event,
        aggregate,
      });

      return event;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to store financial event', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get events for an aggregate with optional filtering
   */
  async getEventsForAggregate(
    aggregateId: string,
    options: EventReplayOptions = {},
  ): Promise<FinancialEventEntity[]> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .where('event.aggregateId = :aggregateId', { aggregateId })
      .orderBy('event.version', 'ASC');

    if (options.fromVersion) {
      queryBuilder.andWhere('event.version >= :fromVersion', {
        fromVersion: options.fromVersion,
      });
    }

    if (options.toVersion) {
      queryBuilder.andWhere('event.version <= :toVersion', {
        toVersion: options.toVersion,
      });
    }

    if (options.eventTypes && options.eventTypes.length > 0) {
      queryBuilder.andWhere('event.eventType IN (:...eventTypes)', {
        eventTypes: options.eventTypes,
      });
    }

    return queryBuilder.getMany();
  }

  /**
   * Replay events to rebuild aggregate state (backward compatibility)
   */
  async replayEvents(
    aggregateId: string,
    options: EventReplayOptions = {},
  ): Promise<Record<string, any>> {
    const events = await this.getEventsForAggregate(aggregateId, options);
    return events.reduce(
      (state, event) => this.applyEventToState(state, event),
      {},
    );
  }

  async replayEventsAdvanced(
    aggregateId: string,
    options: EventReplayOptions = {},
  ): Promise<ReplayResult> {
    const startTime = new Date();
    const events = await this.getEventsForAggregate(aggregateId, options);

    let finalState = {};
    const errors: Array<{ eventId: string; error: string; version: number }> =
      [];
    let eventsProcessed = 0;

    for (const event of events) {
      try {
        if (options.validateState) {
          const previousState = { ...finalState };
          finalState = this.applyEventToState(finalState, event);
          await this.validateStateTransition(previousState, finalState, event);
        } else {
          finalState = this.applyEventToState(finalState, event);
        }
        eventsProcessed++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          eventId: event.id,
          error: errorMessage,
          version: event.version,
        });

        if (options.stopOnError) {
          break;
        }
      }
    }

    const endTime = new Date();

    return {
      finalState,
      eventsProcessed,
      errors,
      metadata: {
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        fromVersion: options.fromVersion,
        toVersion: options.toVersion,
      },
    };
  }

  /**
   * Reconstruct state at a specific timestamp
   */
  async reconstructStateAtTimestamp(
    aggregateId: string,
    timestamp: Date,
  ): Promise<Record<string, any>> {
    const events = await this.eventRepository.find({
      where: {
        aggregateId,
        createdAt: { $lte: timestamp } as any,
      },
      order: { version: 'ASC' },
    });

    return events.reduce(
      (state, event) => this.applyEventToState(state, event),
      {},
    );
  }

  /**
   * Reconstruct state with projections
   */
  async reconstructStateWithProjections(
    options: StateReconstructionOptions,
    projections: EventProjection[] = [],
  ): Promise<{
    state: Record<string, any>;
    projections: Record<string, any>;
    metadata: {
      eventsProcessed: number;
      reconstructionTime: number;
      targetVersion?: number;
      targetTimestamp?: Date;
    };
  }> {
    const startTime = Date.now();

    let queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .where('event.aggregateId = :aggregateId', {
        aggregateId: options.aggregateId,
      })
      .orderBy('event.version', 'ASC');

    if (options.targetVersion) {
      queryBuilder = queryBuilder.andWhere('event.version <= :version', {
        version: options.targetVersion,
      });
    }

    if (options.targetTimestamp) {
      queryBuilder = queryBuilder.andWhere('event.createdAt <= :timestamp', {
        timestamp: options.targetTimestamp,
      });
    }

    const events = await queryBuilder.getMany();

    let state = {};
    const projectionResults: Record<string, any> = {};

    // Initialize projections
    for (const projection of projections) {
      projectionResults[projection.name] = projection.initialState || {};
    }

    // Apply events to state and projections
    for (const event of events) {
      state = this.applyEventToState(state, event);

      if (options.includeProjections) {
        for (const projection of projections) {
          try {
            projectionResults[projection.name] = projection.apply(
              projectionResults[projection.name],
              event,
            );
          } catch (error) {
            this.logger.warn(
              `Failed to apply projection ${projection.name} for event ${event.id}`,
              error,
            );
          }
        }
      }
    }

    // Validate consistency if requested
    if (options.validateConsistency) {
      const currentAggregate = await this.getAggregateState(
        options.aggregateId,
      );
      if (
        JSON.stringify(state) !== JSON.stringify(currentAggregate.currentState)
      ) {
        this.logger.warn(
          `State inconsistency detected for aggregate ${options.aggregateId}`,
        );
      }
    }

    return {
      state,
      projections: options.includeProjections ? projectionResults : {},
      metadata: {
        eventsProcessed: events.length,
        reconstructionTime: Date.now() - startTime,
        targetVersion: options.targetVersion,
        targetTimestamp: options.targetTimestamp,
      },
    };
  }

  /**
   * Replay events for multiple aggregates
   */
  async replayMultipleAggregates(
    aggregateIds: string[],
    options: EventReplayOptions = {},
  ): Promise<Record<string, ReplayResult>> {
    const results: Record<string, ReplayResult> = {};

    for (const aggregateId of aggregateIds) {
      try {
        results[aggregateId] = await this.replayEventsWithCheckpoints(
          aggregateId,
          options,
        );
      } catch (error) {
        this.logger.error(
          `Failed to replay events for aggregate ${aggregateId}`,
          error,
        );
        results[aggregateId] = {
          finalState: {},
          eventsProcessed: 0,
          errors: [{ eventId: '', error: error.message, version: 0 }],
          metadata: {
            startTime: new Date(),
            endTime: new Date(),
            duration: 0,
          },
        };
      }
    }

    return results;
  }

  /**
   * Create advanced snapshot with projections
   */
  async createAdvancedSnapshot(
    aggregateId: string,
    options: {
      includeMetadata?: boolean;
      includeProjections?: boolean;
      projections?: EventProjection[];
      description?: string;
    } = {},
  ): Promise<{
    snapshotId: string;
    aggregateId: string;
    version: number;
    state: Record<string, any>;
    projections?: Record<string, any>;
    metadata: {
      createdAt: Date;
      eventCount: number;
      description?: string;
    };
  }> {
    const aggregate = await this.getAggregateState(aggregateId);
    const events = await this.getEventsForAggregate(aggregateId);

    let projectionResults: Record<string, any> = {};
    if (options.includeProjections && options.projections) {
      const reconstructionResult = await this.reconstructStateWithProjections(
        { aggregateId, includeProjections: true },
        options.projections,
      );
      projectionResults = reconstructionResult.projections;
    }

    const snapshotId = `snapshot_${aggregateId}_${aggregate.lastEventVersion}_${Date.now()}`;

    // Store snapshot (implementation would depend on your storage strategy)
    this.logger.log(
      `Created snapshot ${snapshotId} for aggregate ${aggregateId}`,
    );

    return {
      snapshotId,
      aggregateId,
      version: aggregate.lastEventVersion,
      state: aggregate.currentState,
      projections: options.includeProjections ? projectionResults : undefined,
      metadata: {
        createdAt: new Date(),
        eventCount: events.length,
        description: options.description,
      },
    };
  }

  /**
   * Validate state transition
   */
  private async validateStateTransition(
    previousState: Record<string, any>,
    newState: Record<string, any>,
    event: FinancialEventEntity,
  ): Promise<void> {
    // Implement validation logic based on event type
    switch (event.eventType) {
      case FinancialEventType.PAYMENT_INITIATED:
        this.validatePaymentInitiation(previousState, newState, event);
        break;
      case FinancialEventType.PAYMENT_COMPLETED:
        this.validatePaymentCompletion(previousState, newState, event);
        break;
      case FinancialEventType.COMMISSION_CALCULATED:
        this.validateCommissionCalculation(previousState, newState, event);
        break;
    }
  }

  private validatePaymentInitiation(
    previousState: Record<string, any>,
    newState: Record<string, any>,
    event: FinancialEventEntity,
  ): void {
    if (
      previousState.paymentStatus &&
      previousState.paymentStatus !== 'pending'
    ) {
      throw new BadRequestException('Payment already initiated or completed');
    }
    if (!newState.amount || newState.amount <= 0) {
      throw new BadRequestException('Invalid payment amount');
    }
  }

  private validatePaymentCompletion(
    previousState: Record<string, any>,
    newState: Record<string, any>,
    event: FinancialEventEntity,
  ): void {
    if (previousState.paymentStatus !== 'initiated') {
      throw new BadRequestException(
        'Payment must be initiated before completion',
      );
    }
    if (newState.paymentStatus !== 'completed') {
      throw new BadRequestException('Payment status must be completed');
    }
  }

  private validateCommissionCalculation(
    previousState: Record<string, any>,
    newState: Record<string, any>,
    event: FinancialEventEntity,
  ): void {
    // Add commission calculation validation logic
  }

  /**
   * Get aggregate current state
   */
  async getAggregateState(
    aggregateId: string,
  ): Promise<FinancialAggregateEntity> {
    const aggregate = await this.aggregateRepository.findOne({
      where: { id: aggregateId },
    });

    if (!aggregate) {
      throw new NotFoundException(`Aggregate ${aggregateId} not found`);
    }

    return aggregate;
  }

  /**
   * Mark event as processed
   */
  async markEventProcessed(eventId: string): Promise<void> {
    await this.eventRepository.update(eventId, {
      status: FinancialEventStatus.PROCESSED,
      processedAt: new Date(),
    });
  }

  /**
   * Mark event as failed
   */
  async markEventFailed(eventId: string, errorMessage: string): Promise<void> {
    await this.eventRepository.update(eventId, {
      status: FinancialEventStatus.FAILED,
      errorMessage,
      processedAt: new Date(),
    });
  }

  /**
   * Get audit trail with optional state changes
   */
  async getAuditTrail(options: AuditTrailOptions): Promise<{
    events: FinancialEventEntity[];
    total: number;
    stateChanges?: Array<{
      eventId: string;
      aggregateId: string;
      previousState: any;
      newState: any;
      changedAt: string;
      changedBy: string;
    }>;
  }> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .orderBy('event.createdAt', 'DESC');

    if (options.userId) {
      queryBuilder.andWhere('event.userId = :userId', {
        userId: options.userId,
      });
    }

    if (options.partnerId) {
      queryBuilder.andWhere('event.partnerId = :partnerId', {
        partnerId: options.partnerId,
      });
    }

    if (options.transactionId) {
      queryBuilder.andWhere('event.transactionId = :transactionId', {
        transactionId: options.transactionId,
      });
    }

    if (options.fromDate) {
      queryBuilder.andWhere('event.createdAt >= :fromDate', {
        fromDate: options.fromDate,
      });
    }

    if (options.toDate) {
      queryBuilder.andWhere('event.createdAt <= :toDate', {
        toDate: options.toDate,
      });
    }

    if (options.eventTypes && options.eventTypes.length > 0) {
      queryBuilder.andWhere('event.eventType IN (:...eventTypes)', {
        eventTypes: options.eventTypes,
      });
    }

    const total = await queryBuilder.getCount();

    if (options.limit) {
      queryBuilder.limit(options.limit);
    }

    if (options.offset) {
      queryBuilder.offset(options.offset);
    }

    const events = await queryBuilder.getMany();

    const stateChanges: Array<{
      eventId: string;
      aggregateId: string;
      previousState: any;
      newState: any;
      changedAt: string;
      changedBy: string;
    }> = [];

    if (options.includeStateChanges) {
      // Calculate state changes for each event
      const aggregateStates: Record<string, any> = {};

      for (const event of events.reverse()) {
        const previousState = aggregateStates[event.aggregateId] || {};
        const newState = this.applyEventToState(previousState, event);

        stateChanges.push({
          eventId: event.id,
          aggregateId: event.aggregateId,
          previousState,
          newState,
          changedAt: event.createdAt.toISOString(),
          changedBy: event.userId || 'system',
        });

        aggregateStates[event.aggregateId] = newState;
      }

      stateChanges.reverse(); // Restore original order
    }

    return {
      events,
      total,
      stateChanges: options.includeStateChanges ? stateChanges : undefined,
    };
  }

  /**
   * Get enhanced audit trail with comprehensive metadata and user details
   */
  async getEnhancedAuditTrail(options: AuditTrailOptions): Promise<{
    entries: EnhancedAuditTrailEntry[];
    summary: AuditTrailSummary;
    total: number;
  }> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.aggregate', 'aggregate');

    // Apply filters
    this.applyAuditTrailFilters(queryBuilder, options);

    // Apply sorting
    const sortBy = options.sortBy || 'timestamp';
    const sortOrder = options.sortOrder || 'desc';

    switch (sortBy) {
      case 'timestamp':
        queryBuilder.orderBy(
          'event.createdAt',
          sortOrder.toUpperCase() as 'ASC' | 'DESC',
        );
        break;
      case 'eventType':
        queryBuilder.orderBy(
          'event.eventType',
          sortOrder.toUpperCase() as 'ASC' | 'DESC',
        );
        break;
      case 'aggregateId':
        queryBuilder.orderBy(
          'event.aggregateId',
          sortOrder.toUpperCase() as 'ASC' | 'DESC',
        );
        break;
      default:
        queryBuilder.orderBy('event.createdAt', 'DESC');
    }

    const total = await queryBuilder.getCount();

    if (options.limit) {
      queryBuilder.limit(options.limit);
    }

    if (options.offset) {
      queryBuilder.offset(options.offset);
    }

    const events = await queryBuilder.getMany();

    // Build enhanced audit trail entries
    const entries: EnhancedAuditTrailEntry[] = [];
    const aggregateStates: Record<string, any> = {};

    for (const event of events) {
      const entry: EnhancedAuditTrailEntry = {
        eventId: event.id,
        aggregateId: event.aggregateId,
        aggregateType: this.mapAggregateType(event.aggregateType),
        eventType: event.eventType,
        eventData: event.eventData,
        metadata: {
          timestamp: event.createdAt,
          version: event.version,
          userId: event.userId,
          partnerId: event.partnerId,
          transactionId: event.transactionId,
          correlationId: event.correlationId,
          causationId: event.causationId,
          source: this.mapEventSource(this.determineEventSource(event)),
          severity: this.determineEventSeverity(event),
          tags: this.extractEventTags(event),
          ...this.extractMetadataFromEvent(event),
        },
        processingInfo: {
          processingTime:
            event.metadata?.processingTime ||
            (event.processedAt
              ? event.processedAt.getTime() - event.createdAt.getTime()
              : 0),
          retryCount: event.retryCount || 0,
          status: event.status,
          errorMessage: event.errorMessage,
        },
      };

      // Add state change information if requested
      if (options.includeStateChanges) {
        const previousState = aggregateStates[event.aggregateId] || {};
        const newState = this.applyEventToState(previousState, event);

        entry.stateChange = {
          previousState,
          newState,
          changedFields: this.getChangedFields(previousState, newState),
          changeType: this.determineChangeType(event),
          impactLevel: this.determineImpactLevel(
            event,
            previousState,
            newState,
          ),
        };

        aggregateStates[event.aggregateId] = newState;
      }

      // Add user details if requested
      if (options.includeUserDetails && event.userId) {
        entry.userDetails = await this.getUserDetails(event.userId);
      }

      // Add validation results
      entry.validationResults = this.validateEventSchema(
        event.eventType,
        event.eventData,
        event.schemaVersion,
      );

      entries.push(entry);
    }

    // Generate summary
    const summary = await this.generateAuditTrailSummary(events, options);

    return {
      entries,
      summary,
      total,
    };
  }

  /**
   * Generate compliance audit report
   */
  async generateComplianceAuditReport(
    options: ComplianceAuditOptions,
    auditOptions: AuditTrailOptions,
    generatedBy: string,
  ): Promise<ComplianceAuditReport> {
    const reportId = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get enhanced audit trail
    const auditTrail = await this.getEnhancedAuditTrail(auditOptions);

    // Generate compliance findings
    const findings = await this.analyzeComplianceFindings(
      auditTrail.entries,
      options.complianceStandard === 'CUSTOM'
        ? 'general'
        : options.complianceStandard,
    );

    // Assess data integrity
    const dataIntegrity = await this.assessDataIntegrity(auditTrail.entries);

    // Check retention compliance
    const retentionCompliance = await this.checkRetentionCompliance(
      auditTrail.entries,
      options.complianceStandard,
    );

    // Generate recommendations
    const recommendations = this.generateComplianceRecommendations(
      findings,
      dataIntegrity,
      retentionCompliance,
    );

    return {
      reportId,
      standard: options.complianceStandard,
      generatedAt: new Date(),
      generatedBy,
      period: {
        from: auditOptions.fromDate || new Date(0),
        to: auditOptions.toDate || new Date(),
      },
      summary: auditTrail.summary,
      findings,
      dataIntegrity,
      retentionCompliance,
      recommendations,
    };
  }

  /**
   * Get audit trail for specific user actions
   */
  async getUserActionAuditTrail(
    userId: string,
    options: Partial<AuditTrailOptions> = {},
  ): Promise<{
    entries: EnhancedAuditTrailEntry[];
    summary: {
      totalActions: number;
      actionsByType: Record<FinancialEventType, number>;
      timeRange: { earliest: Date; latest: Date };
      riskScore: number; // 0-100
    };
  }> {
    const auditOptions: AuditTrailOptions = {
      ...options,
      userId,
      includeUserDetails: true,
      includeStateChanges: true,
      sortBy: 'timestamp',
      sortOrder: 'desc',
    };

    const auditTrail = await this.getEnhancedAuditTrail(auditOptions);

    // Calculate risk score based on user actions
    const riskScore = this.calculateUserRiskScore(auditTrail.entries);

    const actionsByType = auditTrail.entries.reduce(
      (acc, entry) => {
        acc[entry.eventType] = (acc[entry.eventType] || 0) + 1;
        return acc;
      },
      {} as Record<FinancialEventType, number>,
    );

    const timestamps = auditTrail.entries.map((e) => e.metadata.timestamp);
    const timeRange = {
      earliest: new Date(Math.min(...timestamps.map((t) => t.getTime()))),
      latest: new Date(Math.max(...timestamps.map((t) => t.getTime()))),
    };

    return {
      entries: auditTrail.entries,
      summary: {
        totalActions: auditTrail.entries.length,
        actionsByType,
        timeRange,
        riskScore,
      },
    };
  }

  /**
   * Track sensitive data access for compliance
   */
  async trackSensitiveDataAccess(
    eventData: FinancialEventData & {
      accessType: 'read' | 'write' | 'delete';
      dataType: 'pii' | 'financial' | 'payment' | 'sensitive';
      dataFields: string[];
      justification?: string;
    },
  ): Promise<FinancialEventEntity> {
    // Enhance event data with compliance metadata
    const enhancedEventData: FinancialEventData = {
      ...eventData,
      metadata: {
        ...eventData.metadata,
        complianceTracking: {
          accessType: eventData.accessType,
          dataType: eventData.dataType,
          dataFields: eventData.dataFields,
          justification: eventData.justification,
          timestamp: new Date(),
          ipAddress: eventData.metadata?.ipAddress,
          userAgent: eventData.metadata?.userAgent,
          sessionId: eventData.metadata?.sessionId,
        },
        severity: this.determineSensitivitySeverity(
          eventData.dataType,
          eventData.accessType,
        ),
        tags: [
          'sensitive-data',
          'compliance',
          eventData.dataType,
          eventData.accessType,
        ],
      },
    };

    return this.storeEvent(enhancedEventData);
  }

  /**
   * Apply audit trail filters to query builder
   */
  private applyAuditTrailFilters(
    queryBuilder: any,
    options: AuditTrailOptions,
  ): void {
    if (options.userId) {
      queryBuilder.andWhere('event.userId = :userId', {
        userId: options.userId,
      });
    }

    if (options.partnerId) {
      queryBuilder.andWhere('event.partnerId = :partnerId', {
        partnerId: options.partnerId,
      });
    }

    if (options.aggregateIds && options.aggregateIds.length > 0) {
      queryBuilder.andWhere('event.aggregateId IN (:...aggregateIds)', {
        aggregateIds: options.aggregateIds,
      });
    }

    if (options.aggregateType) {
      queryBuilder.andWhere('event.aggregateType = :aggregateType', {
        aggregateType: options.aggregateType,
      });
    }

    if (options.eventTypes && options.eventTypes.length > 0) {
      queryBuilder.andWhere('event.eventType IN (:...eventTypes)', {
        eventTypes: options.eventTypes,
      });
    }

    if (options.fromDate) {
      queryBuilder.andWhere('event.createdAt >= :fromDate', {
        fromDate: options.fromDate,
      });
    }

    if (options.toDate) {
      queryBuilder.andWhere('event.createdAt <= :toDate', {
        toDate: options.toDate,
      });
    }

    if (options.transactionId) {
      queryBuilder.andWhere('event.transactionId = :transactionId', {
        transactionId: options.transactionId,
      });
    }

    if (options.correlationId) {
      queryBuilder.andWhere('event.correlationId = :correlationId', {
        correlationId: options.correlationId,
      });
    }

    if (options.severity) {
      queryBuilder.andWhere("event.metadata ->> 'severity' = :severity", {
        severity: options.severity,
      });
    }

    if (options.tags && options.tags.length > 0) {
      queryBuilder.andWhere("event.metadata ->> 'tags' ?| array[:tags]", {
        tags: options.tags,
      });
    }
  }

  /**
   * Determine event source from event metadata
   */
  private determineEventSource(event: FinancialEventEntity): string {
    if (event.metadata?.source) {
      return event.metadata.source;
    }

    // Infer source from event type or metadata
    if (event.eventType.includes('payment')) {
      return 'payment-service';
    } else if (event.eventType.includes('wallet')) {
      return 'wallet-service';
    } else if (event.eventType.includes('commission')) {
      return 'commission-service';
    } else if (event.eventType.includes('refund')) {
      return 'refund-service';
    }

    return 'unknown';
  }

  /**
   * Map event source to expected audit trail source type
   */
  private mapEventSource(
    source: string,
  ): 'api' | 'system' | 'migration' | 'replay' {
    // Map various source types to the expected enum values
    if (source.includes('api') || source.includes('service')) {
      return 'api';
    } else if (source.includes('migration')) {
      return 'migration';
    } else if (source.includes('replay')) {
      return 'replay';
    } else {
      return 'system';
    }
  }

  private mapAggregateType(aggregateType: string): AggregateType {
    // Map string values to AggregateType enum
    switch (aggregateType.toLowerCase()) {
      case 'payment':
        return AggregateType.PAYMENT;
      case 'wallet':
        return AggregateType.WALLET;
      case 'commission':
        return AggregateType.COMMISSION;
      case 'refund':
        return AggregateType.REFUND;
      case 'payout':
        return AggregateType.PAYOUT;
      case 'transaction':
        return AggregateType.TRANSACTION;
      case 'financial_report':
        return AggregateType.FINANCIAL_REPORT;
      default:
        // Default to TRANSACTION if unknown
        return AggregateType.TRANSACTION;
    }
  }

  /**
   * Determine event severity level
   */
  private determineEventSeverity(
    event: FinancialEventEntity,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (event.metadata?.severity) {
      return event.metadata.severity;
    }

    // Determine severity based on event type and data
    const criticalEvents = [
      'payment_failed',
      'refund_failed',
      'wallet_insufficient_funds',
    ];
    const highEvents = [
      'payment_completed',
      'refund_completed',
      'commission_calculated',
    ];
    const mediumEvents = [
      'payment_initiated',
      'wallet_credited',
      'wallet_debited',
    ];

    if (criticalEvents.includes(event.eventType)) {
      return 'critical';
    } else if (highEvents.includes(event.eventType)) {
      return 'high';
    } else if (mediumEvents.includes(event.eventType)) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Extract tags from event metadata
   */
  private extractEventTags(event: FinancialEventEntity): string[] {
    const tags: string[] = [];

    // Add event type as tag
    tags.push(event.eventType);

    // Add aggregate type as tag
    tags.push(event.aggregateType);

    // Add metadata tags if available
    if (event.metadata?.tags) {
      tags.push(...event.metadata.tags);
    }

    // Add inferred tags based on event data
    if (event.eventData.amount && event.eventData.amount > 10000) {
      tags.push('high-value');
    }

    if (event.eventData.currency && event.eventData.currency !== 'USD') {
      tags.push('foreign-currency');
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Extract additional metadata from event
   */
  private extractMetadataFromEvent(
    event: FinancialEventEntity,
  ): Record<string, any> {
    const metadata: Record<string, any> = {};

    if (event.metadata) {
      // Copy relevant metadata fields
      const relevantFields = [
        'ipAddress',
        'userAgent',
        'sessionId',
        'deviceId',
        'location',
        'riskScore',
        'complianceFlags',
      ];

      relevantFields.forEach((field) => {
        if (event.metadata[field]) {
          metadata[field] = event.metadata[field];
        }
      });
    }

    return metadata;
  }

  /**
   * Get changed fields between two states
   */
  private getChangedFields(previousState: any, newState: any): string[] {
    const changedFields: string[] = [];

    // Compare all fields in both states
    const allFields = new Set([
      ...Object.keys(previousState || {}),
      ...Object.keys(newState || {}),
    ]);

    allFields.forEach((field) => {
      const prevValue = previousState?.[field];
      const newValue = newState?.[field];

      if (JSON.stringify(prevValue) !== JSON.stringify(newValue)) {
        changedFields.push(field);
      }
    });

    return changedFields;
  }

  /**
   * Determine change type from event
   */
  private determineChangeType(
    event: FinancialEventEntity,
  ): 'create' | 'update' | 'delete' | 'restore' {
    if (
      event.eventType.includes('created') ||
      event.eventType.includes('initiated')
    ) {
      return 'create';
    } else if (
      event.eventType.includes('updated') ||
      event.eventType.includes('modified')
    ) {
      return 'update';
    } else if (
      event.eventType.includes('deleted') ||
      event.eventType.includes('cancelled')
    ) {
      return 'delete';
    } else if (
      event.eventType.includes('completed') ||
      event.eventType.includes('failed') ||
      event.eventType.includes('restored')
    ) {
      return 'restore';
    }

    return 'update';
  }

  /**
   * Determine impact level of change
   */
  private determineImpactLevel(
    event: FinancialEventEntity,
    previousState: any,
    newState: any,
  ): 'minor' | 'moderate' | 'major' | 'critical' {
    // Critical impact for status changes to failed states
    if (newState.status === 'failed' && previousState.status !== 'failed') {
      return 'critical';
    }

    // Major impact for financial amounts
    if (event.eventData.amount && event.eventData.amount > 10000) {
      return 'major';
    }

    // Moderate impact for status changes
    if (previousState.status !== newState.status) {
      return 'moderate';
    }

    return 'minor';
  }

  /**
   * Get user details for audit trail
   */
  private async getUserDetails(userId: string): Promise<any> {
    // This would typically fetch from a user service
    // For now, return basic structure
    return {
      userId,
      // These would be fetched from actual user service
      username: `user_${userId}`,
      email: `user_${userId}@example.com`,
      role: 'user',
      lastLogin: new Date(),
    };
  }

  /**
   * Generate audit trail summary
   */
  private async generateAuditTrailSummary(
    events: FinancialEventEntity[],
    options: AuditTrailOptions,
  ): Promise<AuditTrailSummary> {
    const eventsByType = events.reduce(
      (acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      },
      {} as Record<FinancialEventType, number>,
    );

    const eventsBySeverity = events.reduce(
      (acc, event) => {
        const severity = this.determineEventSeverity(event);
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const uniqueUsers = new Set(events.map((e) => e.userId).filter(Boolean))
      .size;
    const uniqueAggregates = new Set(events.map((e) => e.aggregateId)).size;

    const timestamps = events.map((e) => e.createdAt);
    const timeRange =
      timestamps.length > 0
        ? {
            earliest: new Date(Math.min(...timestamps.map((t) => t.getTime()))),
            latest: new Date(Math.max(...timestamps.map((t) => t.getTime()))),
          }
        : null;

    return {
      totalEvents: events.length,
      eventsByType,
      eventsByStatus: {} as Record<FinancialEventStatus, number>,
      eventsBySeverity,
      uniqueUsers,
      uniqueAggregates,
      dateRange: timeRange || {
        earliest: new Date(),
        latest: new Date(),
      },
      topUsers: [],
      topAggregates: [],
      errorSummary: {
        totalErrors: 0,
        errorsByType: {},
        criticalErrors: 0,
      },
    };
  }

  /**
   * Analyze compliance findings
   */
  private async analyzeComplianceFindings(
    entries: EnhancedAuditTrailEntry[],
    standard: 'SOX' | 'PCI_DSS' | 'GDPR' | 'general',
  ): Promise<any[]> {
    const findings: any[] = [];

    switch (standard) {
      case 'SOX':
        findings.push(...this.analyzeSoxCompliance(entries));
        break;
      case 'PCI_DSS':
        findings.push(...this.analyzePciDssCompliance(entries));
        break;
      case 'GDPR':
        findings.push(...this.analyzeGdprCompliance(entries));
        break;
      case 'general':
        findings.push(...this.analyzeGeneralCompliance(entries));
        break;
    }

    return findings;
  }

  /**
   * Analyze SOX compliance
   */
  private analyzeSoxCompliance(entries: EnhancedAuditTrailEntry[]): any[] {
    const findings: any[] = [];

    // Check for proper segregation of duties
    const userActions = entries.reduce(
      (acc, entry) => {
        if (entry.metadata.userId) {
          acc[entry.metadata.userId] = acc[entry.metadata.userId] || [];
          acc[entry.metadata.userId].push(entry.eventType);
        }
        return acc;
      },
      {} as Record<string, string[]>,
    );

    Object.entries(userActions).forEach(([userId, actions]) => {
      const hasInitiation = actions.some((a) => a.includes('initiated'));
      const hasApproval = actions.some((a) => a.includes('completed'));

      if (hasInitiation && hasApproval) {
        findings.push({
          type: 'segregation_of_duties_violation',
          severity: 'high',
          description: `User ${userId} both initiated and approved transactions`,
          userId,
          recommendation: 'Implement proper segregation of duties controls',
        });
      }
    });

    return findings;
  }

  /**
   * Analyze PCI DSS compliance
   */
  private analyzePciDssCompliance(entries: EnhancedAuditTrailEntry[]): any[] {
    const findings: any[] = [];

    entries.forEach((entry) => {
      // Check for payment card data exposure
      if (entry.eventType.includes('payment') && entry.eventData) {
        const eventDataStr = JSON.stringify(entry.eventData);

        // Check for potential card number patterns
        if (/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/.test(eventDataStr)) {
          findings.push({
            type: 'potential_card_data_exposure',
            severity: 'critical',
            description: 'Potential card number found in event data',
            eventId: entry.eventId,
            recommendation: 'Ensure card data is properly masked or tokenized',
          });
        }
      }
    });

    return findings;
  }

  /**
   * Analyze GDPR compliance
   */
  private analyzeGdprCompliance(entries: EnhancedAuditTrailEntry[]): any[] {
    const findings: any[] = [];

    // Check for data retention compliance
    const oldEntries = entries.filter((entry) => {
      const age = Date.now() - entry.metadata.timestamp.getTime();
      return age > 7 * 365 * 24 * 60 * 60 * 1000; // 7 years
    });

    if (oldEntries.length > 0) {
      findings.push({
        type: 'data_retention_violation',
        severity: 'medium',
        description: `${oldEntries.length} entries exceed 7-year retention period`,
        recommendation:
          'Review and purge old data according to retention policy',
      });
    }

    return findings;
  }

  /**
   * Analyze general compliance
   */
  private analyzeGeneralCompliance(entries: EnhancedAuditTrailEntry[]): any[] {
    const findings: any[] = [];

    // Check for failed events without proper handling
    const failedEvents = entries.filter(
      (entry) =>
        entry.eventType.includes('failed') &&
        !entry.processingInfo.errorMessage,
    );

    if (failedEvents.length > 0) {
      findings.push({
        type: 'insufficient_error_logging',
        severity: 'medium',
        description: `${failedEvents.length} failed events without error messages`,
        recommendation:
          'Ensure all failed events include detailed error information',
      });
    }

    return findings;
  }

  /**
   * Assess data integrity
   */
  private async assessDataIntegrity(
    entries: EnhancedAuditTrailEntry[],
  ): Promise<any> {
    const integrity = {
      score: 100,
      issues: [] as any[],
      checksPerformed: [] as string[],
    };

    // Check for event sequence integrity
    const aggregateEvents = entries.reduce(
      (acc, entry) => {
        acc[entry.aggregateId] = acc[entry.aggregateId] || [];
        acc[entry.aggregateId].push(entry);
        return acc;
      },
      {} as Record<string, EnhancedAuditTrailEntry[]>,
    );

    Object.entries(aggregateEvents).forEach(([aggregateId, events]) => {
      const sortedEvents = events.sort(
        (a, b) =>
          a.metadata.timestamp.getTime() - b.metadata.timestamp.getTime(),
      );

      // Check for version gaps
      for (let i = 1; i < sortedEvents.length; i++) {
        const prevVersion = sortedEvents[i - 1].metadata.version;
        const currentVersion = sortedEvents[i].metadata.version;

        if (currentVersion !== prevVersion + 1) {
          integrity.issues.push({
            type: 'version_gap',
            aggregateId,
            expectedVersion: prevVersion + 1,
            actualVersion: currentVersion,
          });
          integrity.score -= 5;
        }
      }
    });

    integrity.checksPerformed.push('version_sequence', 'event_ordering');

    return integrity;
  }

  /**
   * Check retention compliance
   */
  private async checkRetentionCompliance(
    entries: EnhancedAuditTrailEntry[],
    standard: string,
  ): Promise<any> {
    const retentionPeriods = {
      SOX: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      PCI_DSS: 1 * 365 * 24 * 60 * 60 * 1000, // 1 year
      GDPR: 6 * 365 * 24 * 60 * 60 * 1000, // 6 years for financial data
      general: 5 * 365 * 24 * 60 * 60 * 1000, // 5 years
    };

    const retentionPeriod =
      retentionPeriods[standard] || retentionPeriods.general;
    const cutoffDate = new Date(Date.now() - retentionPeriod);

    const expiredEntries = entries.filter(
      (entry) => entry.metadata.timestamp < cutoffDate,
    );

    return {
      compliant: expiredEntries.length === 0,
      expiredEntries: expiredEntries.length,
      retentionPeriodDays: Math.floor(retentionPeriod / (24 * 60 * 60 * 1000)),
      oldestEntry:
        entries.length > 0
          ? Math.min(...entries.map((e) => e.metadata.timestamp.getTime()))
          : null,
    };
  }

  /**
   * Generate compliance recommendations
   */
  private generateComplianceRecommendations(
    findings: any[],
    dataIntegrity: any,
    retentionCompliance: any,
  ): string[] {
    const recommendations: string[] = [];

    if (findings.length > 0) {
      recommendations.push('Address identified compliance findings');
    }

    if (dataIntegrity.score < 95) {
      recommendations.push('Improve data integrity controls');
    }

    if (!retentionCompliance.compliant) {
      recommendations.push('Implement proper data retention policies');
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain current compliance practices');
    }

    return recommendations;
  }

  /**
   * Calculate user risk score
   */
  private calculateUserRiskScore(entries: EnhancedAuditTrailEntry[]): number {
    let riskScore = 0;

    // Base risk factors
    const failedEvents = entries.filter((e) =>
      e.eventType.includes('failed'),
    ).length;
    const highValueEvents = entries.filter(
      (e) => e.eventData.amount && e.eventData.amount > 10000,
    ).length;

    riskScore += failedEvents * 10;
    riskScore += highValueEvents * 5;

    // Time-based risk (frequent actions in short time)
    const recentEvents = entries.filter(
      (e) => Date.now() - e.metadata.timestamp.getTime() < 24 * 60 * 60 * 1000,
    );

    if (recentEvents.length > 50) {
      riskScore += 20;
    }

    return Math.min(riskScore, 100);
  }

  /**
   * Determine sensitivity severity
   */
  private determineSensitivitySeverity(
    dataType: string,
    accessType: string,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (dataType === 'pii' && accessType === 'delete') {
      return 'critical';
    } else if (dataType === 'financial' && accessType === 'write') {
      return 'high';
    } else if (dataType === 'payment') {
      return 'high';
    } else if (dataType === 'sensitive') {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Advanced replay with checkpoints, validation, and performance metrics
   */
  async replayEventsWithCheckpoints(
    aggregateId: string,
    options: AdvancedReplayOptions = {},
  ): Promise<ReplayResult> {
    const startTime = Date.now();
    const performanceMetrics = {
      eventsPerSecond: 0,
      averageEventProcessingTime: 0,
      memoryUsage: 0,
      peakMemoryUsage: 0,
    };

    const validationResults = {
      businessRuleViolations: [] as Array<{
        eventId: string;
        rule: string;
        violation: string;
      }>,
      stateConsistencyChecks: {
        passed: 0,
        failed: 0,
        details: [] as Array<{
          check: string;
          result: boolean;
          message?: string;
        }>,
      },
    };

    const checkpoints: ReplayCheckpoint[] = [];
    const errors: Array<{ eventId: string; error: string; version: number }> =
      [];

    try {
      const events = await this.getEventsForAggregate(aggregateId, options);
      let state: Record<string, any> = {};
      let projectionResults: Record<string, any> = {};

      // Initialize projections
      if (options.includeProjections && options.projections) {
        for (const projection of options.projections) {
          projectionResults[projection.name] = projection.initialState || {};
        }
      }

      const eventProcessingTimes: number[] = [];
      let processedCount = 0;

      for (const event of events) {
        const eventStartTime = Date.now();

        try {
          // Create checkpoint if requested
          if (options.checkpoints?.includes(event.version)) {
            checkpoints.push({
              version: event.version,
              state: JSON.parse(JSON.stringify(state)),
              timestamp: new Date(),
              eventId: event.id,
              projections: options.includeProjections
                ? JSON.parse(JSON.stringify(projectionResults))
                : undefined,
            });
          }

          // Apply custom validators if provided
          if (options.customValidators) {
            for (const validator of options.customValidators) {
              try {
                const isValid = validator.validate(state, event);
                if (!isValid) {
                  validationResults.businessRuleViolations.push({
                    eventId: event.id,
                    rule: validator.name,
                    violation: validator.errorMessage,
                  });

                  if (options.stopOnError) {
                    throw new Error(
                      `Business rule violation: ${validator.errorMessage}`,
                    );
                  }
                }
              } catch (validationError) {
                validationResults.businessRuleViolations.push({
                  eventId: event.id,
                  rule: validator.name,
                  violation: validationError.message,
                });
              }
            }
          }

          // Apply event to state (skip if dry run)
          if (!options.dryRun) {
            const previousState = JSON.parse(JSON.stringify(state));
            state = this.applyEventToState(state, event);

            // Validate business rules if requested
            if (options.validateBusinessRules) {
              try {
                await this.validateStateTransition(previousState, state, event);
                validationResults.stateConsistencyChecks.passed++;
                validationResults.stateConsistencyChecks.details.push({
                  check: `state_transition_${event.eventType}`,
                  result: true,
                });
              } catch (validationError) {
                validationResults.stateConsistencyChecks.failed++;
                validationResults.stateConsistencyChecks.details.push({
                  check: `state_transition_${event.eventType}`,
                  result: false,
                  message: validationError.message,
                });

                if (options.stopOnError) {
                  throw validationError;
                }
              }
            }

            // Apply projections
            if (options.includeProjections && options.projections) {
              for (const projection of options.projections) {
                try {
                  projectionResults[projection.name] = projection.apply(
                    projectionResults[projection.name],
                    event,
                  );
                } catch (projectionError) {
                  this.logger.warn(
                    `Failed to apply projection ${projection.name} for event ${event.id}`,
                    projectionError,
                  );
                }
              }
            }
          }

          processedCount++;
          const eventProcessingTime = Date.now() - eventStartTime;
          eventProcessingTimes.push(eventProcessingTime);

          // Update performance metrics
          performanceMetrics.memoryUsage = process.memoryUsage().heapUsed;
          performanceMetrics.peakMemoryUsage = Math.max(
            performanceMetrics.peakMemoryUsage,
            performanceMetrics.memoryUsage,
          );

          // Call progress callback if provided
          if (options.progressCallback) {
            options.progressCallback({
              processed: processedCount,
              total: events.length,
              currentEvent: event,
              currentState: state,
            });
          }
        } catch (error) {
          errors.push({
            eventId: event.id,
            error: error.message,
            version: event.version,
          });

          if (options.rollbackOnError && checkpoints.length > 0) {
            // Rollback to last checkpoint
            const lastCheckpoint = checkpoints[checkpoints.length - 1];
            state = lastCheckpoint.state;
            if (options.includeProjections && lastCheckpoint.projections) {
              projectionResults = lastCheckpoint.projections;
            }
            this.logger.warn(
              `Rolled back to checkpoint at version ${lastCheckpoint.version} due to error`,
            );
          }

          if (options.stopOnError) {
            break;
          }
        }
      }

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      // Calculate final performance metrics
      performanceMetrics.eventsPerSecond =
        processedCount / (totalDuration / 1000);
      performanceMetrics.averageEventProcessingTime =
        eventProcessingTimes.reduce((sum, time) => sum + time, 0) /
        eventProcessingTimes.length;

      return {
        finalState: state,
        eventsProcessed: processedCount,
        errors,
        projections: options.includeProjections ? projectionResults : undefined,
        metadata: {
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          duration: totalDuration,
          fromVersion: options.fromVersion,
          toVersion: options.toVersion,
        },
        performanceMetrics: options.includePerformanceMetrics
          ? performanceMetrics
          : undefined,
        validationResults:
          options.validateBusinessRules || options.customValidators
            ? validationResults
            : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Failed to replay events for aggregate ${aggregateId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Replay multiple aggregates in parallel
   */
  async replayMultipleAggregatesParallel(
    options: ParallelReplayOptions,
  ): Promise<Record<string, ReplayResult>> {
    const maxConcurrency = options.maxConcurrency || 5;
    const results: Record<string, ReplayResult> = {};
    const errors: Array<{ aggregateId: string; error: string }> = [];

    // Process aggregates in batches
    const batches = this.chunkArray(options.aggregateIds, maxConcurrency);

    for (const batch of batches) {
      const batchPromises = batch.map(async (aggregateId) => {
        try {
          const replayOptions: AdvancedReplayOptions = {
            includeProjections: !!options.sharedProjections,
            projections: options.sharedProjections,
            includePerformanceMetrics: true,
            validateBusinessRules: true,
          };

          const result = await this.replayEventsWithCheckpoints(
            aggregateId,
            replayOptions,
          );
          results[aggregateId] = result;
        } catch (error) {
          errors.push({
            aggregateId,
            error: error.message,
          });

          if (options.failFast) {
            throw error;
          }
        }
      });

      await Promise.all(batchPromises);
    }

    if (errors.length > 0) {
      this.logger.warn(
        `Parallel replay completed with ${errors.length} errors`,
        errors,
      );
    }

    return results;
  }

  /**
   * Replay events with projection-based state reconstruction
   */
  async replayWithProjections(
    aggregateId: string,
    projections: EventProjection[],
    options: EventReplayOptions = {},
  ): Promise<{
    finalState: Record<string, any>;
    projectionResults: Record<string, any>;
    metadata: {
      eventsProcessed: number;
      projectionErrors: Array<{
        projectionName: string;
        eventId: string;
        error: string;
      }>;
    };
  }> {
    const events = await this.getEventsForAggregate(aggregateId, options);
    let state: Record<string, any> = {};
    const projectionResults: Record<string, any> = {};
    const projectionErrors: Array<{
      projectionName: string;
      eventId: string;
      error: string;
    }> = [];

    // Initialize projections
    for (const projection of projections) {
      projectionResults[projection.name] = projection.initialState || {};
    }

    // Process events
    for (const event of events) {
      // Apply to main state
      state = this.applyEventToState(state, event);

      // Apply to each projection
      for (const projection of projections) {
        try {
          projectionResults[projection.name] = projection.apply(
            projectionResults[projection.name],
            event,
          );
        } catch (error) {
          projectionErrors.push({
            projectionName: projection.name,
            eventId: event.id,
            error: error.message,
          });

          this.logger.warn(
            `Projection ${projection.name} failed for event ${event.id}`,
            error,
          );
        }
      }
    }

    return {
      finalState: state,
      projectionResults,
      metadata: {
        eventsProcessed: events.length,
        projectionErrors,
      },
    };
  }

  /**
   * Validate replay consistency across multiple aggregates
   */
  async validateReplayConsistency(
    aggregateIds: string[],
    options: EventReplayOptions = {},
  ): Promise<{
    consistencyScore: number; // 0-100
    inconsistencies: Array<{
      aggregateId: string;
      issue: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
    summary: {
      totalAggregates: number;
      consistentAggregates: number;
      inconsistentAggregates: number;
    };
  }> {
    const inconsistencies: Array<{
      aggregateId: string;
      issue: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }> = [];

    let consistentCount = 0;

    for (const aggregateId of aggregateIds) {
      try {
        const replayResult = await this.replayEventsAdvanced(aggregateId, {
          ...options,
          validateState: true,
        });

        const currentAggregate = await this.getAggregateState(aggregateId);

        // Compare replayed state with current state
        if (
          JSON.stringify(replayResult.finalState) !==
          JSON.stringify(currentAggregate.currentState)
        ) {
          inconsistencies.push({
            aggregateId,
            issue: 'State mismatch between replay and current state',
            severity: 'high',
          });
        } else {
          consistentCount++;
        }

        // Check for replay errors
        if (replayResult.errors.length > 0) {
          inconsistencies.push({
            aggregateId,
            issue: `${replayResult.errors.length} replay errors detected`,
            severity: replayResult.errors.length > 5 ? 'critical' : 'medium',
          });
        }
      } catch (error) {
        inconsistencies.push({
          aggregateId,
          issue: `Failed to replay events: ${error.message}`,
          severity: 'critical',
        });
      }
    }

    const consistencyScore = (consistentCount / aggregateIds.length) * 100;

    return {
      consistencyScore,
      inconsistencies,
      summary: {
        totalAggregates: aggregateIds.length,
        consistentAggregates: consistentCount,
        inconsistentAggregates: aggregateIds.length - consistentCount,
      },
    };
  }

  /**
   * Utility method to chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Get events for aggregate with replay options
   */

  /**
   * Apply event to state
   */

  /**
   * Validate state transition
   */

  /**
   * Migrate events to new schema version
   */
  async migrateEvents(options: EventMigrationOptions): Promise<{
    migratedCount: number;
    errors: Array<{ eventId: string; error: string }>;
    summary: {
      totalEvents: number;
      successfulMigrations: number;
      failedMigrations: number;
      skippedEvents: number;
    };
  }> {
    const errors: Array<{ eventId: string; error: string }> = [];
    let migratedCount = 0;
    let skippedCount = 0;

    try {
      // Get events to migrate
      const query = this.eventRepository.createQueryBuilder('event');

      if (options.fromVersion) {
        query.andWhere('event.schemaVersion >= :fromVersion', {
          fromVersion: options.fromVersion,
        });
      }

      if (options.toVersion) {
        query.andWhere('event.schemaVersion <= :toVersion', {
          toVersion: options.toVersion,
        });
      }

      if (options.eventTypes && options.eventTypes.length > 0) {
        query.andWhere('event.eventType IN (:...eventTypes)', {
          eventTypes: options.eventTypes,
        });
      }

      if (options.aggregateIds && options.aggregateIds.length > 0) {
        query.andWhere('event.aggregateId IN (:...aggregateIds)', {
          aggregateIds: options.aggregateIds,
        });
      }

      const events = await query.getMany();

      // Process events in batches
      const batchSize = options.batchSize || 100;
      const batches = this.chunkArray(events, batchSize);

      for (const batch of batches) {
        const batchPromises = batch.map(async (event) => {
          try {
            // Check if migration is needed
            if (event.schemaVersion === options.targetSchemaVersion) {
              skippedCount++;
              return;
            }

            // Apply migration transformations
            const migratedEvent = await this.applyEventMigration(
              event,
              options,
            );

            if (options.dryRun) {
              // Just validate the migration without saving
              await this.validateMigratedEvent(migratedEvent, options);
              migratedCount++;
            } else {
              // Save the migrated event
              if (options.preserveOriginal) {
                // Create a new event with migrated data
                const newEvent = this.eventRepository.create({
                  ...migratedEvent,
                  id: undefined, // Let database generate new ID
                  originalEventId: event.id,
                });
                await this.eventRepository.save(newEvent);
              } else {
                // Update the existing event
                await this.eventRepository.update(event.id, {
                  eventData: migratedEvent.eventData,
                  schemaVersion: migratedEvent.schemaVersion,
                  metadata: {
                    ...event.metadata,
                    migrationHistory: [
                      ...(event.metadata?.migrationHistory || []),
                      {
                        fromVersion: event.schemaVersion,
                        toVersion: options.targetSchemaVersion,
                        migratedAt: new Date(),
                        migrationRules: options.migrationRules.map(
                          (rule) => rule.name,
                        ),
                      },
                    ],
                  },
                });
              }
              migratedCount++;
            }
          } catch (error) {
            errors.push({
              eventId: event.id,
              error: error.message,
            });

            if (options.stopOnError) {
              throw error;
            }
          }
        });

        await Promise.all(batchPromises);
      }

      return {
        migratedCount,
        errors,
        summary: {
          totalEvents: events.length,
          successfulMigrations: migratedCount,
          failedMigrations: errors.length,
          skippedEvents: skippedCount,
        },
      };
    } catch (error) {
      this.logger.error('Failed to migrate events', error);
      throw error;
    }
  }

  /**
   * Rollback events to previous schema version
   */
  async rollbackEventMigration(options: {
    targetSchemaVersion: number;
    aggregateIds?: string[];
    eventTypes?: string[];
    dryRun?: boolean;
    batchSize?: number;
  }): Promise<{
    rolledBackCount: number;
    errors: Array<{ eventId: string; error: string }>;
  }> {
    const errors: Array<{ eventId: string; error: string }> = [];
    let rolledBackCount = 0;

    try {
      const query = this.eventRepository
        .createQueryBuilder('event')
        .where('event.schemaVersion != :targetVersion', {
          targetVersion: options.targetSchemaVersion,
        });

      if (options.aggregateIds && options.aggregateIds.length > 0) {
        query.andWhere('event.aggregateId IN (:...aggregateIds)', {
          aggregateIds: options.aggregateIds,
        });
      }

      if (options.eventTypes && options.eventTypes.length > 0) {
        query.andWhere('event.eventType IN (:...eventTypes)', {
          eventTypes: options.eventTypes,
        });
      }

      const events = await query.getMany();

      for (const event of events) {
        try {
          const migrationHistory = event.metadata?.migrationHistory || [];

          // Find the target version in migration history
          const targetMigration = migrationHistory.find(
            (migration) =>
              migration.fromVersion === options.targetSchemaVersion,
          );

          if (!targetMigration) {
            errors.push({
              eventId: event.id,
              error: `No migration history found for target version ${options.targetSchemaVersion}`,
            });
            continue;
          }

          if (!options.dryRun) {
            // Rollback to the target version
            // This is a simplified rollback - in practice, you'd need to store
            // the original event data or have reverse migration rules
            await this.eventRepository.update(event.id, {
              schemaVersion: options.targetSchemaVersion,
              metadata: {
                ...event.metadata,
                rollbackHistory: [
                  ...(event.metadata?.rollbackHistory || []),
                  {
                    fromVersion: event.schemaVersion,
                    toVersion: options.targetSchemaVersion,
                    rolledBackAt: new Date(),
                  },
                ],
              },
            });
          }

          rolledBackCount++;
        } catch (error) {
          errors.push({
            eventId: event.id,
            error: error.message,
          });
        }
      }

      return {
        rolledBackCount,
        errors,
      };
    } catch (error) {
      this.logger.error('Failed to rollback event migration', error);
      throw error;
    }
  }

  /**
   * Get event schema evolution history
   */
  async getSchemaEvolutionHistory(): Promise<{
    versions: Array<{
      version: number;
      introducedAt: Date;
      eventCount: number;
      changes: string[];
    }>;
    currentVersion: number;
    migrationStatus: {
      totalEvents: number;
      eventsByVersion: Record<number, number>;
      pendingMigrations: Array<{
        fromVersion: number;
        toVersion: number;
        affectedEvents: number;
      }>;
    };
  }> {
    try {
      // Get all unique schema versions
      const versionQuery = await this.eventRepository
        .createQueryBuilder('event')
        .select('event.schemaVersion', 'version')
        .addSelect('MIN(event.createdAt)', 'introducedAt')
        .addSelect('COUNT(*)', 'eventCount')
        .groupBy('event.schemaVersion')
        .orderBy('introducedAt', 'ASC')
        .getRawMany();

      const versions = versionQuery.map((row) => ({
        version: row.version,
        introducedAt: new Date(row.introducedAt),
        eventCount: parseInt(row.eventCount),
        changes: [], // This would be populated from a schema change log
      }));

      // Get current version (latest)
      const currentVersion = versions[versions.length - 1]?.version || '1.0.0';

      // Get migration status
      const totalEvents = await this.eventRepository.count();
      const eventsByVersion: Record<string, number> = {};

      for (const version of versions) {
        eventsByVersion[version.version] = version.eventCount;
      }

      // Identify pending migrations (events not on current version)
      const pendingMigrations: Array<{
        fromVersion: number;
        toVersion: number;
        affectedEvents: number;
      }> = [];

      for (const version of versions) {
        if (version.version !== currentVersion) {
          pendingMigrations.push({
            fromVersion: version.version,
            toVersion: currentVersion,
            affectedEvents: version.eventCount,
          });
        }
      }

      return {
        versions,
        currentVersion,
        migrationStatus: {
          totalEvents,
          eventsByVersion,
          pendingMigrations,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get schema evolution history', error);
      throw error;
    }
  }

  /**
   * Validate event schema compatibility
   */
  async validateSchemaCompatibility(
    fromVersion: number,
    toVersion: number,
  ): Promise<{
    isCompatible: boolean;
    issues: Array<{
      type: 'breaking_change' | 'data_loss' | 'validation_error';
      field: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
    recommendations: string[];
  }> {
    const issues: Array<{
      type: 'breaking_change' | 'data_loss' | 'validation_error';
      field: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }> = [];
    const recommendations: string[] = [];

    try {
      // Get sample events from both versions
      const fromVersionEvents = await this.eventRepository
        .createQueryBuilder('event')
        .where('event.schemaVersion = :version', { version: fromVersion })
        .limit(100)
        .getMany();

      const toVersionEvents = await this.eventRepository
        .createQueryBuilder('event')
        .where('event.schemaVersion = :version', { version: toVersion })
        .limit(100)
        .getMany();

      // Analyze schema differences
      if (fromVersionEvents.length > 0 && toVersionEvents.length > 0) {
        const fromSchema = this.extractEventSchema(fromVersionEvents);
        const toSchema = this.extractEventSchema(toVersionEvents);

        // Check for removed fields
        for (const field of fromSchema.fields) {
          if (!toSchema.fields.includes(field)) {
            issues.push({
              type: 'data_loss',
              field,
              description: `Field '${field}' exists in version ${fromVersion} but not in ${toVersion}`,
              severity: 'high',
            });
            recommendations.push(
              `Consider adding migration rule to preserve '${field}' data`,
            );
          }
        }

        // Check for type changes
        for (const eventType of fromSchema.eventTypes) {
          if (!toSchema.eventTypes.includes(eventType)) {
            issues.push({
              type: 'breaking_change',
              field: 'eventType',
              description: `Event type '${eventType}' no longer supported in version ${toVersion}`,
              severity: 'critical',
            });
            recommendations.push(
              `Add migration rule for event type '${eventType}'`,
            );
          }
        }
      }

      const isCompatible =
        issues.filter(
          (issue) => issue.severity === 'critical' || issue.severity === 'high',
        ).length === 0;

      if (!isCompatible) {
        recommendations.push('Review migration strategy before proceeding');
        recommendations.push(
          'Consider gradual migration with backward compatibility',
        );
      }

      return {
        isCompatible,
        issues,
        recommendations,
      };
    } catch (error) {
      this.logger.error('Failed to validate schema compatibility', error);
      throw error;
    }
  }

  /**
   * Apply migration to a single event
   */
  private async applyEventMigration(
    event: FinancialEventEntity,
    options: EventMigrationOptions,
  ): Promise<FinancialEventEntity> {
    const migratedEvent = { ...event };

    // Apply each migration rule
    for (const rule of options.migrationRules) {
      try {
        if (rule.eventType === event.eventType) {
          if (!rule.conditions || rule.conditions(migratedEvent.eventData)) {
            migratedEvent.eventData = rule.transform(migratedEvent.eventData);
          }
        }
      } catch (error) {
        this.logger.warn(
          `Migration rule '${rule.name || 'unnamed'}' failed for event ${event.id}`,
          error,
        );

        if (rule.required) {
          throw error;
        }
      }
    }

    // Update schema version
    migratedEvent.schemaVersion = options.targetSchemaVersion;

    // Create a new FinancialEventEntity instance with the migrated data
    const entity = new FinancialEventEntity();
    Object.assign(entity, migratedEvent);
    return entity;
  }

  /**
   * Validate migrated event
   */
  private async validateMigratedEvent(
    event: FinancialEventEntity,
    options: EventMigrationOptions,
  ): Promise<void> {
    // Apply validation rules if provided
    if (options.validationRules) {
      for (const rule of options.validationRules) {
        const isValid = await rule.validate(event);
        if (!isValid) {
          throw new Error(
            `Validation failed for rule '${rule.name}': ${rule.errorMessage}`,
          );
        }
      }
    }

    // Basic schema validation
    if (!event.eventType || !event.aggregateId || !event.eventData) {
      throw new Error('Migrated event is missing required fields');
    }

    // Validate schema version
    if (event.schemaVersion !== options.targetSchemaVersion) {
      throw new Error(
        `Schema version mismatch: expected ${options.targetSchemaVersion}, got ${event.schemaVersion}`,
      );
    }
  }

  /**
   * Extract schema information from events
   */
  private extractEventSchema(events: FinancialEventEntity[]): {
    fields: string[];
    eventTypes: string[];
    dataStructure: Record<string, any>;
  } {
    const fields = new Set<string>();
    const eventTypes = new Set<string>();
    const dataStructure: Record<string, any> = {};

    for (const event of events) {
      // Collect event types
      eventTypes.add(event.eventType);

      // Collect fields from event data
      if (event.eventData && typeof event.eventData === 'object') {
        this.collectFields(event.eventData, fields, '');
      }

      // Analyze data structure
      if (!dataStructure[event.eventType]) {
        dataStructure[event.eventType] = {};
      }

      if (event.eventData) {
        this.mergeDataStructure(
          dataStructure[event.eventType],
          event.eventData,
        );
      }
    }

    return {
      fields: Array.from(fields),
      eventTypes: Array.from(eventTypes),
      dataStructure,
    };
  }

  /**
   * Recursively collect field names
   */
  private collectFields(obj: any, fields: Set<string>, prefix: string): void {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fieldName = prefix ? `${prefix}.${key}` : key;
        fields.add(fieldName);

        if (
          typeof obj[key] === 'object' &&
          obj[key] !== null &&
          !Array.isArray(obj[key])
        ) {
          this.collectFields(obj[key], fields, fieldName);
        }
      }
    }
  }

  /**
   * Merge data structure for schema analysis
   */
  private mergeDataStructure(target: any, source: any): void {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          typeof source[key] === 'object' &&
          source[key] !== null &&
          !Array.isArray(source[key])
        ) {
          if (!target[key]) {
            target[key] = {};
          }
          this.mergeDataStructure(target[key], source[key]);
        } else {
          target[key] = typeof source[key];
        }
      }
    }
  }

  /**
   * Create snapshot at specific version or timestamp
   */
  async createSnapshot(options: SnapshotOptions): Promise<void> {
    let events: FinancialEventEntity[];

    if (options.atVersion) {
      events = await this.getEventsForAggregate(options.aggregateId, {
        toVersion: options.atVersion,
      });
    } else if (options.atTimestamp) {
      events = await this.eventRepository.find({
        where: {
          aggregateId: options.aggregateId,
          createdAt: { $lte: options.atTimestamp } as any,
        },
        order: { version: 'ASC' },
      });
    } else {
      events = await this.getEventsForAggregate(options.aggregateId);
    }

    const state = events.reduce(
      (currentState, event) => this.applyEventToState(currentState, event),
      {},
    );

    // Store snapshot (implementation depends on your storage strategy)
    this.logger.log(
      `Created snapshot for aggregate ${options.aggregateId} with ${events.length} events`,
    );
  }

  /**
   * Migrate events based on migration rules
   */

  /**
   * Validate aggregate consistency
   */
  async validateAggregateConsistency(aggregateId: string): Promise<{
    isConsistent: boolean;
    issues: string[];
    currentState: any;
    replayedState: any;
  }> {
    const aggregate = await this.getAggregateState(aggregateId);
    const replayedState = await this.replayEvents(aggregateId);

    const currentStateStr = JSON.stringify(aggregate.currentState);
    const replayedStateStr = JSON.stringify(replayedState);

    const isConsistent = currentStateStr === replayedStateStr;
    const issues: string[] = [];

    if (!isConsistent) {
      issues.push('State mismatch between stored and replayed state');

      // Find specific differences
      const currentKeys = Object.keys(aggregate.currentState);
      const replayedKeys = Object.keys(replayedState);

      const missingKeys = currentKeys.filter(
        (key) => !replayedKeys.includes(key),
      );
      const extraKeys = replayedKeys.filter(
        (key) => !currentKeys.includes(key),
      );

      if (missingKeys.length > 0) {
        issues.push(
          `Missing keys in replayed state: ${missingKeys.join(', ')}`,
        );
      }

      if (extraKeys.length > 0) {
        issues.push(`Extra keys in replayed state: ${extraKeys.join(', ')}`);
      }

      // Check value differences
      for (const key of currentKeys) {
        if (replayedKeys.includes(key)) {
          if (aggregate.currentState[key] !== replayedState[key]) {
            issues.push(
              `Value mismatch for key '${key}': stored=${aggregate.currentState[key]}, replayed=${replayedState[key]}`,
            );
          }
        }
      }
    }

    return {
      isConsistent,
      issues,
      currentState: aggregate.currentState,
      replayedState,
    };
  }

  /**
   * Get financial events by criteria
   */
  async getEventsByCriteria(criteria: {
    eventTypes?: FinancialEventType[];
    userId?: string;
    partnerId?: string;
    bookingId?: string;
    transactionId?: string;
    status?: FinancialEventStatus;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ events: FinancialEventEntity[]; total: number }> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .orderBy('event.createdAt', 'DESC');

    if (criteria.eventTypes && criteria.eventTypes.length > 0) {
      queryBuilder.andWhere('event.eventType IN (:...eventTypes)', {
        eventTypes: criteria.eventTypes,
      });
    }

    if (criteria.userId) {
      queryBuilder.andWhere('event.userId = :userId', {
        userId: criteria.userId,
      });
    }

    if (criteria.partnerId) {
      queryBuilder.andWhere('event.partnerId = :partnerId', {
        partnerId: criteria.partnerId,
      });
    }

    if (criteria.bookingId) {
      queryBuilder.andWhere('event.bookingId = :bookingId', {
        bookingId: criteria.bookingId,
      });
    }

    if (criteria.transactionId) {
      queryBuilder.andWhere('event.transactionId = :transactionId', {
        transactionId: criteria.transactionId,
      });
    }

    if (criteria.status) {
      queryBuilder.andWhere('event.status = :status', {
        status: criteria.status,
      });
    }

    if (criteria.fromDate) {
      queryBuilder.andWhere('event.createdAt >= :fromDate', {
        fromDate: criteria.fromDate,
      });
    }

    if (criteria.toDate) {
      queryBuilder.andWhere('event.createdAt <= :toDate', {
        toDate: criteria.toDate,
      });
    }

    const total = await queryBuilder.getCount();

    if (criteria.limit) {
      queryBuilder.limit(criteria.limit);
    }

    if (criteria.offset) {
      queryBuilder.offset(criteria.offset);
    }

    const events = await queryBuilder.getMany();

    return { events, total };
  }

  /**
   * Get financial analytics from events
   */
  async getFinancialAnalytics(criteria: {
    fromDate?: Date;
    toDate?: Date;
    partnerId?: string;
    eventTypes?: FinancialEventType[];
  }): Promise<{
    totalAmount: number;
    eventCounts: Record<string, number>;
    dailyBreakdown: Array<{ date: string; amount: number; count: number }>;
  }> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .where('event.amount IS NOT NULL');

    if (criteria.fromDate) {
      queryBuilder.andWhere('event.createdAt >= :fromDate', {
        fromDate: criteria.fromDate,
      });
    }

    if (criteria.toDate) {
      queryBuilder.andWhere('event.createdAt <= :toDate', {
        toDate: criteria.toDate,
      });
    }

    if (criteria.partnerId) {
      queryBuilder.andWhere('event.partnerId = :partnerId', {
        partnerId: criteria.partnerId,
      });
    }

    if (criteria.eventTypes && criteria.eventTypes.length > 0) {
      queryBuilder.andWhere('event.eventType IN (:...eventTypes)', {
        eventTypes: criteria.eventTypes,
      });
    }

    const events = await queryBuilder.getMany();

    const totalAmount = events.reduce(
      (sum, event) => sum + (event.amount || 0),
      0,
    );

    const eventCounts = events.reduce(
      (counts, event) => {
        counts[event.eventType] = (counts[event.eventType] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>,
    );

    const dailyBreakdown = events.reduce(
      (breakdown, event) => {
        const date = event.createdAt.toISOString().split('T')[0];
        const existing = breakdown.find((item) => item.date === date);

        if (existing) {
          existing.amount += event.amount || 0;
          existing.count += 1;
        } else {
          breakdown.push({
            date,
            amount: event.amount || 0,
            count: 1,
          });
        }

        return breakdown;
      },
      [] as Array<{ date: string; amount: number; count: number }>,
    );

    return {
      totalAmount,
      eventCounts,
      dailyBreakdown: dailyBreakdown.sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    };
  }

  /**
   * Apply event to aggregate state
   */
  private applyEventToState(
    currentState: Record<string, any>,
    event: FinancialEventEntity,
  ): Record<string, any> {
    const newState = { ...currentState };

    switch (event.eventType) {
      case FinancialEventType.PAYMENT_INITIATED:
        newState.paymentStatus = 'initiated';
        newState.amount = event.eventData.amount;
        newState.currency = event.eventData.currency;
        break;

      case FinancialEventType.PAYMENT_COMPLETED:
        newState.paymentStatus = 'completed';
        newState.completedAt = event.createdAt;
        break;

      case FinancialEventType.PAYMENT_FAILED:
        newState.paymentStatus = 'failed';
        newState.failureReason = event.eventData.reason;
        break;

      case FinancialEventType.WALLET_CREDITED:
        newState.balance = (newState.balance || 0) + (event.amount || 0);
        newState.lastCreditedAt = event.createdAt;
        break;

      case FinancialEventType.WALLET_DEBITED:
        newState.balance = (newState.balance || 0) - (event.amount || 0);
        newState.lastDebitedAt = event.createdAt;
        break;

      case FinancialEventType.WALLET_HOLD_CREATED:
        newState.heldAmount = (newState.heldAmount || 0) + (event.amount || 0);
        newState.availableBalance =
          (newState.balance || 0) - (newState.heldAmount || 0);
        break;

      case FinancialEventType.WALLET_HOLD_RELEASED:
        newState.heldAmount = (newState.heldAmount || 0) - (event.amount || 0);
        newState.availableBalance =
          (newState.balance || 0) - (newState.heldAmount || 0);
        break;

      case FinancialEventType.COMMISSION_CALCULATED:
        newState.commissionAmount = event.amount;
        newState.commissionRate = event.eventData.rate;
        newState.commissionCalculatedAt = event.createdAt;
        break;

      case FinancialEventType.REFUND_INITIATED:
        newState.refundStatus = 'initiated';
        newState.refundAmount = event.amount;
        break;

      case FinancialEventType.REFUND_COMPLETED:
        newState.refundStatus = 'completed';
        newState.refundCompletedAt = event.createdAt;
        break;

      default:
        // Store generic event data
        newState.lastEventType = event.eventType;
        newState.lastEventData = event.eventData;
        break;
    }

    newState.lastUpdated = event.createdAt;
    newState.version = event.version;

    return newState;
  }

  // Event Versioning and Migration Methods

  registerEventVersion(schemaVersion: EventSchemaVersion): void {
    const eventType = schemaVersion.eventType;

    if (!this.eventVersionRegistry[eventType]) {
      this.eventVersionRegistry[eventType] = {
        currentVersion: schemaVersion.version,
        versions: [schemaVersion],
        migrationPath: [],
      };
    } else {
      const registry = this.eventVersionRegistry[eventType];

      // Add version if not exists
      const existingVersion = registry.versions.find(
        (v) => v.version === schemaVersion.version,
      );
      if (!existingVersion) {
        registry.versions.push(schemaVersion);
        registry.versions.sort((a, b) => a.version - b.version);
      }

      // Update current version if this is newer
      if (schemaVersion.version > registry.currentVersion) {
        registry.currentVersion = schemaVersion.version;
      }

      // Update migration path
      this.updateMigrationPath(eventType);
    }

    this.logger.log(
      `Registered event version ${schemaVersion.version} for ${eventType}`,
    );
  }

  private updateMigrationPath(eventType: FinancialEventType): void {
    const registry = this.eventVersionRegistry[eventType];
    if (!registry) return;

    registry.migrationPath = [];

    // Create migration path between consecutive versions
    for (let i = 0; i < registry.versions.length - 1; i++) {
      const fromVersion = registry.versions[i];
      const toVersion = registry.versions[i + 1];

      if (toVersion.migrationRules && toVersion.migrationRules.length > 0) {
        registry.migrationPath.push({
          from: fromVersion.version,
          to: toVersion.version,
          migrationRule: toVersion.migrationRules[0], // Use first rule as default
        });
      }
    }
  }

  getCurrentSchemaVersion(eventType: FinancialEventType): number {
    const registry = this.eventVersionRegistry[eventType];
    return registry ? registry.currentVersion : 1;
  }

  validateEventSchema(
    eventType: FinancialEventType,
    eventData: Record<string, any>,
    version?: number,
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const registry = this.eventVersionRegistry[eventType];
    if (!registry) {
      return { isValid: true, errors: [], warnings: [] }; // No schema registered, assume valid
    }

    const targetVersion = version || registry.currentVersion;
    const schemaVersion = registry.versions.find(
      (v) => v.version === targetVersion,
    );

    if (!schemaVersion) {
      return {
        isValid: false,
        errors: [`Schema version ${targetVersion} not found for ${eventType}`],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (schemaVersion.requiredFields) {
      for (const field of schemaVersion.requiredFields) {
        if (!(field in eventData)) {
          errors.push(`Required field '${field}' is missing`);
        }
      }
    }

    // Check deprecated fields
    if (schemaVersion.deprecatedFields) {
      for (const field of schemaVersion.deprecatedFields) {
        if (field in eventData) {
          warnings.push(`Deprecated field '${field}' should not be used`);
        }
      }
    }

    // Validate against schema (basic validation)
    if (schemaVersion.schema) {
      for (const [field, expectedType] of Object.entries(
        schemaVersion.schema,
      )) {
        if (field in eventData) {
          const actualType = typeof eventData[field];
          if (actualType !== expectedType) {
            errors.push(
              `Field '${field}' should be of type ${expectedType}, got ${actualType}`,
            );
          }
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  async migrateEventsWithVersioning(
    options: EventVersioningOptions,
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    const affectedAggregates = new Set<string>();
    let migratedCount = 0;
    let skippedCount = 0;
    const errors: Array<{ eventId: string; error: string; version: number }> =
      [];

    // Get events to migrate
    const events = await this.eventRepository.find({
      where: {
        eventType: options.eventType,
        // Add metadata filter for schema version if needed
      },
      order: { createdAt: 'ASC' },
    });

    // Create backup if requested
    let backupCreated = false;
    if (options.backupOriginal) {
      await this.createEventBackup(events);
      backupCreated = true;
    }

    // Get migration path
    const migrationPath = this.getMigrationPath(
      options.eventType,
      options.fromSchemaVersion,
      options.toSchemaVersion,
    );

    if (migrationPath.length === 0) {
      throw new BadRequestException(
        `No migration path found from version ${options.fromSchemaVersion} to ${options.toSchemaVersion}`,
      );
    }

    // Process each event
    for (const event of events) {
      try {
        const eventSchemaVersion = event.metadata?.schemaVersion || 1;

        if (eventSchemaVersion !== options.fromSchemaVersion) {
          skippedCount++;
          continue;
        }

        // Apply migration rules in sequence
        let currentData = { ...event.eventData };

        for (const migration of migrationPath) {
          if (
            migration.migrationRule.conditions &&
            !migration.migrationRule.conditions(currentData)
          ) {
            skippedCount++;
            continue;
          }

          currentData = migration.migrationRule.transform(currentData);
        }

        // Update event with migrated data
        const updatedMetadata: any = {
          ...event.metadata,
          schemaVersion: options.toSchemaVersion,
          migrated: true,
          migratedAt: new Date().toISOString(),
          migrationStrategy: options.migrationStrategy,
          originalSchemaVersion: options.fromSchemaVersion,
        };

        if (options.backupOriginal) {
          updatedMetadata.originalData = event.eventData;
        }

        await this.eventRepository.update(event.id, {
          eventData: currentData,
          metadata: updatedMetadata as any,
        });

        migratedCount++;
        affectedAggregates.add(event.aggregateId);

        this.logger.debug(
          `Migrated event ${event.id} from version ${options.fromSchemaVersion} to ${options.toSchemaVersion}`,
        );
      } catch (error) {
        errors.push({
          eventId: event.id,
          error: error.message,
          version: event.version,
        });
        this.logger.error(`Failed to migrate event ${event.id}`, error);
      }
    }

    const migrationTime = Date.now() - startTime;

    this.logger.log(
      `Migration completed: ${migratedCount} migrated, ${skippedCount} skipped, ${errors.length} errors`,
    );

    return {
      migratedCount,
      skippedCount,
      errors,
      backupCreated,
      migrationTime,
      affectedAggregates: Array.from(affectedAggregates),
    };
  }

  private getMigrationPath(
    eventType: FinancialEventType,
    fromVersion: number,
    toVersion: number,
  ): Array<{ from: number; to: number; migrationRule: EventMigrationRule }> {
    const registry = this.eventVersionRegistry[eventType];
    if (!registry) {
      return [];
    }

    const path: Array<{
      from: number;
      to: number;
      migrationRule: EventMigrationRule;
    }> = [];
    let currentVersion = fromVersion;

    while (currentVersion < toVersion) {
      const migration = registry.migrationPath.find(
        (m) => m.from === currentVersion,
      );
      if (!migration) {
        this.logger.warn(
          `No migration found from version ${currentVersion} for ${eventType}`,
        );
        break;
      }

      path.push(migration);
      currentVersion = migration.to;
    }

    return path;
  }

  private async createEventBackup(
    events: FinancialEventEntity[],
  ): Promise<void> {
    const backupData = {
      timestamp: new Date().toISOString(),
      eventCount: events.length,
      events: events.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        eventData: event.eventData,
        metadata: event.metadata,
        version: event.version,
        createdAt: event.createdAt,
      })),
    };

    // Store backup (implementation depends on your backup strategy)
    // This could be file system, S3, database table, etc.
    this.logger.log(`Created backup for ${events.length} events`);
  }

  async rollbackMigration(
    eventIds: string[],
    targetVersion?: number,
  ): Promise<{
    rolledBackCount: number;
    errors: Array<{ eventId: string; error: string }>;
  }> {
    let rolledBackCount = 0;
    const errors: Array<{ eventId: string; error: string }> = [];

    for (const eventId of eventIds) {
      try {
        const event = await this.eventRepository.findOne({
          where: { id: eventId },
        });
        if (!event) {
          errors.push({ eventId, error: 'Event not found' });
          continue;
        }

        const metadata = event.metadata as any;
        if (!metadata?.migrated || !metadata?.originalData) {
          errors.push({
            eventId,
            error: 'Event was not migrated or backup data not available',
          });
          continue;
        }

        // Restore original data
        const restoredMetadata = { ...metadata };
        delete restoredMetadata.migrated;
        delete restoredMetadata.migratedAt;
        delete restoredMetadata.migrationStrategy;
        delete restoredMetadata.originalData;

        if (targetVersion) {
          restoredMetadata.schemaVersion = targetVersion;
        } else {
          restoredMetadata.schemaVersion = metadata.originalSchemaVersion || 1;
        }

        await this.eventRepository.update(eventId, {
          eventData: metadata.originalData,
          metadata: restoredMetadata,
        });

        rolledBackCount++;
        this.logger.debug(`Rolled back event ${eventId}`);
      } catch (error) {
        errors.push({ eventId, error: error.message });
        this.logger.error(`Failed to rollback event ${eventId}`, error);
      }
    }

    return { rolledBackCount, errors };
  }

  async getEventsBySchemaVersion(
    eventType: FinancialEventType,
    schemaVersion: number,
  ): Promise<FinancialEventEntity[]> {
    return this.eventRepository.find({
      where: {
        eventType,
        // Add metadata filter for schema version
      },
    });
  }

  async getMigrationStatus(eventType: FinancialEventType): Promise<{
    currentVersion: number;
    versionDistribution: Record<number, number>;
    pendingMigrations: Array<{
      fromVersion: number;
      toVersion: number;
      eventCount: number;
    }>;
  }> {
    const registry = this.eventVersionRegistry[eventType];
    const currentVersion = registry ? registry.currentVersion : 1;

    // Get all events of this type
    const events = await this.eventRepository.find({
      where: { eventType },
    });

    // Calculate version distribution
    const versionDistribution: Record<number, number> = {};
    for (const event of events) {
      const version = (event.metadata as any)?.schemaVersion || 1;
      versionDistribution[version] = (versionDistribution[version] || 0) + 1;
    }

    // Calculate pending migrations
    const pendingMigrations: Array<{
      fromVersion: number;
      toVersion: number;
      eventCount: number;
    }> = [];

    for (const [version, count] of Object.entries(versionDistribution)) {
      const versionNum = parseInt(version);
      if (versionNum < currentVersion) {
        pendingMigrations.push({
          fromVersion: versionNum,
          toVersion: currentVersion,
          eventCount: count,
        });
      }
    }

    return {
      currentVersion,
      versionDistribution,
      pendingMigrations,
    };
  }
}

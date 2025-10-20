import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import {
  AnalyticsQueryDto,
  AnalyticsStatsDto,
  BulkCreateAnalyticsDto,
  CreateAnalyticsDto,
  DashboardDto,
  MetricTrendDto,
  UpdateAnalyticsDto,
} from './dto/analytics.dto';
import {
  AnalyticsEntity,
  AnalyticsType,
  MetricCategory,
  PREDEFINED_METRICS,
  TimeGranularity,
} from './entities/analytics.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEntity)
    private readonly analyticsRepository: Repository<AnalyticsEntity>,
  ) {}

  async create(
    createAnalyticsDto: CreateAnalyticsDto,
  ): Promise<AnalyticsEntity> {
    try {
      // Validate date format
      const date = new Date(createAnalyticsDto.date);
      if (isNaN(date.getTime())) {
        throw new BadRequestException('Invalid date format');
      }

      // Check for duplicate metric on the same date
      const existing = await this.analyticsRepository.findOne({
        where: {
          metricName: createAnalyticsDto.metricName,
          date: date,
          entityType: createAnalyticsDto.entityType || null,
          entityId: createAnalyticsDto.entityId || null,
          granularity: createAnalyticsDto.granularity || TimeGranularity.DAILY,
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Analytics record already exists for metric '${createAnalyticsDto.metricName}' on ${date.toISOString().split('T')[0]}`,
        );
      }

      // Calculate change percentage if previous value is provided
      let changePercentage = createAnalyticsDto.changePercentage;
      if (
        createAnalyticsDto.previousValue &&
        createAnalyticsDto.previousValue > 0
      ) {
        changePercentage =
          ((createAnalyticsDto.value - createAnalyticsDto.previousValue) /
            createAnalyticsDto.previousValue) *
          100;
      }

      const analytics = this.analyticsRepository.create({
        ...createAnalyticsDto,
        date,
        changePercentage,
        granularity: createAnalyticsDto.granularity || TimeGranularity.DAILY,
        isActive: createAnalyticsDto.isActive ?? true,
        isPublic: createAnalyticsDto.isPublic ?? false,
        collectedAt: createAnalyticsDto.collectedAt
          ? new Date(createAnalyticsDto.collectedAt)
          : new Date(),
      });

      return await this.analyticsRepository.save(analytics);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create analytics record: ${error.message}`,
      );
    }
  }

  async bulkCreate(bulkCreateDto: BulkCreateAnalyticsDto): Promise<{
    created: AnalyticsEntity[];
    errors: Array<{ index: number; error: string }>;
  }> {
    const created: AnalyticsEntity[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < bulkCreateDto.records.length; i++) {
      try {
        const record = await this.create(bulkCreateDto.records[i]);
        created.push(record);
      } catch (error) {
        errors.push({ index: i, error: error.message });
        if (!bulkCreateDto.skipErrors) {
          throw new BadRequestException(
            `Bulk create failed at index ${i}: ${error.message}`,
          );
        }
      }
    }

    return { created, errors };
  }

  async findAll(query: AnalyticsQueryDto): Promise<{
    data: AnalyticsEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      type,
      category,
      metricName,
      entityType,
      entityId,
      startDate,
      endDate,
      granularity,
      isActive,
      isPublic,
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder =
      this.analyticsRepository.createQueryBuilder('analytics');

    // Apply filters
    if (type) {
      queryBuilder.andWhere('analytics.type = :type', { type });
    }
    if (category) {
      queryBuilder.andWhere('analytics.category = :category', { category });
    }
    if (metricName) {
      queryBuilder.andWhere('analytics.metricName ILIKE :metricName', {
        metricName: `%${metricName}%`,
      });
    }
    if (entityType) {
      queryBuilder.andWhere('analytics.entityType = :entityType', {
        entityType,
      });
    }
    if (entityId) {
      queryBuilder.andWhere('analytics.entityId = :entityId', { entityId });
    }
    if (startDate && endDate) {
      queryBuilder.andWhere('analytics.date BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    } else if (startDate) {
      queryBuilder.andWhere('analytics.date >= :startDate', {
        startDate: new Date(startDate),
      });
    } else if (endDate) {
      queryBuilder.andWhere('analytics.date <= :endDate', {
        endDate: new Date(endDate),
      });
    }
    if (granularity) {
      queryBuilder.andWhere('analytics.granularity = :granularity', {
        granularity,
      });
    }
    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere('analytics.isActive = :isActive', { isActive });
    }
    if (typeof isPublic === 'boolean') {
      queryBuilder.andWhere('analytics.isPublic = :isPublic', { isPublic });
    }

    // Apply sorting
    queryBuilder.orderBy(`analytics.${sortBy}`, sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<AnalyticsEntity> {
    const analytics = await this.analyticsRepository.findOne({
      where: { id },
    });

    if (!analytics) {
      throw new NotFoundException(`Analytics record with ID ${id} not found`);
    }

    return analytics;
  }

  async update(
    id: string,
    updateAnalyticsDto: UpdateAnalyticsDto,
  ): Promise<AnalyticsEntity> {
    const analytics = await this.findOne(id);

    // Calculate change percentage if value and previous value are provided
    let changePercentage = updateAnalyticsDto.changePercentage;
    if (
      updateAnalyticsDto.value &&
      updateAnalyticsDto.previousValue &&
      updateAnalyticsDto.previousValue > 0
    ) {
      changePercentage =
        ((updateAnalyticsDto.value - updateAnalyticsDto.previousValue) /
          updateAnalyticsDto.previousValue) *
        100;
    }

    Object.assign(analytics, {
      ...updateAnalyticsDto,
      changePercentage,
    });

    return await this.analyticsRepository.save(analytics);
  }

  async remove(id: string): Promise<void> {
    const analytics = await this.findOne(id);
    await this.analyticsRepository.remove(analytics);
  }

  async getStats(): Promise<AnalyticsStatsDto> {
    const [total, activeMetrics, publicMetrics] = await Promise.all([
      this.analyticsRepository.count(),
      this.analyticsRepository.count({ where: { isActive: true } }),
      this.analyticsRepository.count({ where: { isPublic: true } }),
    ]);

    // Get metrics by type
    const byTypeQuery = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('analytics.type')
      .getRawMany();

    const byType = Object.values(AnalyticsType).reduce(
      (acc, type) => {
        acc[type] = 0;
        return acc;
      },
      {} as Record<AnalyticsType, number>,
    );

    byTypeQuery.forEach((item) => {
      byType[item.type] = parseInt(item.count);
    });

    // Get metrics by category
    const byCategoryQuery = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('analytics.category')
      .getRawMany();

    const byCategory = Object.values(MetricCategory).reduce(
      (acc, category) => {
        acc[category] = 0;
        return acc;
      },
      {} as Record<MetricCategory, number>,
    );

    byCategoryQuery.forEach((item) => {
      byCategory[item.category] = parseInt(item.count);
    });

    // Get metrics by granularity
    const byGranularityQuery = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.granularity', 'granularity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('analytics.granularity')
      .getRawMany();

    const byGranularity = Object.values(TimeGranularity).reduce(
      (acc, granularity) => {
        acc[granularity] = 0;
        return acc;
      },
      {} as Record<TimeGranularity, number>,
    );

    byGranularityQuery.forEach((item) => {
      byGranularity[item.granularity] = parseInt(item.count);
    });

    // Get date range
    const dateRangeQuery = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select('MIN(analytics.date)', 'earliest')
      .addSelect('MAX(analytics.date)', 'latest')
      .getRawOne();

    const dateRange = {
      earliest: dateRangeQuery?.earliest || new Date(),
      latest: dateRangeQuery?.latest || new Date(),
    };

    // Get top performing metrics
    const topMetricsQuery = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.metricName', 'metricName')
      .addSelect('analytics.type', 'type')
      .addSelect('analytics.category', 'category')
      .addSelect('AVG(analytics.value)', 'avgValue')
      .addSelect('COUNT(*)', 'totalRecords')
      .groupBy('analytics.metricName, analytics.type, analytics.category')
      .orderBy('AVG(analytics.value)', 'DESC')
      .limit(10)
      .getRawMany();

    const topMetrics = topMetricsQuery.map((item) => ({
      metricName: item.metricName,
      type: item.type,
      category: item.category,
      avgValue: parseFloat(item.avgValue),
      totalRecords: parseInt(item.totalRecords),
    }));

    // Get data quality summary
    const qualityQuery = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select(
        'AVG((analytics.quality->>"confidence")::numeric)',
        'avgConfidence',
      )
      .addSelect(
        'AVG((analytics.quality->>"completeness")::numeric)',
        'avgCompleteness',
      )
      .addSelect(
        'AVG((analytics.quality->>"accuracy")::numeric)',
        'avgAccuracy',
      )
      .addSelect(
        'AVG((analytics.quality->>"timeliness")::numeric)',
        'avgTimeliness',
      )
      .where('analytics.quality IS NOT NULL')
      .getRawOne();

    const qualitySummary = {
      avgConfidence: parseFloat(qualityQuery?.avgConfidence) || 0,
      avgCompleteness: parseFloat(qualityQuery?.avgCompleteness) || 0,
      avgAccuracy: parseFloat(qualityQuery?.avgAccuracy) || 0,
      avgTimeliness: parseFloat(qualityQuery?.avgTimeliness) || 0,
    };

    return {
      total,
      activeMetrics,
      publicMetrics,
      byType,
      byCategory,
      byGranularity,
      dateRange,
      topMetrics,
      qualitySummary,
    };
  }

  async getMetricTrend(
    metricName: string,
    startDate: string,
    endDate: string,
    granularity: TimeGranularity = TimeGranularity.DAILY,
  ): Promise<MetricTrendDto> {
    const dataPoints = await this.analyticsRepository.find({
      where: {
        metricName,
        date: Between(new Date(startDate), new Date(endDate)),
        granularity,
        isActive: true,
      },
      order: { date: 'ASC' },
    });

    if (dataPoints.length === 0) {
      throw new NotFoundException(
        `No data found for metric '${metricName}' in the specified date range`,
      );
    }

    // Calculate trend analysis
    const values = dataPoints.map((dp) => dp.value);
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const trendPercentage =
      firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(trendPercentage) > 5) {
      direction = trendPercentage > 0 ? 'up' : 'down';
    }

    const significance: 'high' | 'medium' | 'low' =
      Math.abs(trendPercentage) > 20
        ? 'high'
        : Math.abs(trendPercentage) > 10
          ? 'medium'
          : 'low';

    // Calculate statistical summary
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const sortedValues = [...values].sort((a, b) => a - b);
    const median =
      sortedValues.length % 2 === 0
        ? (sortedValues[sortedValues.length / 2 - 1] +
            sortedValues[sortedValues.length / 2]) /
          2
        : sortedValues[Math.floor(sortedValues.length / 2)];
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);

    return {
      metricName,
      dataPoints: dataPoints.map((dp) => ({
        date: dp.date,
        value: dp.value,
        changePercentage: dp.changePercentage,
      })),
      trend: {
        direction,
        percentage: trendPercentage,
        significance,
      },
      summary: {
        min,
        max,
        avg,
        median,
        stdDev,
      },
    };
  }

  async getDashboard(
    startDate?: string,
    endDate?: string,
  ): Promise<DashboardDto> {
    const dateFilter =
      startDate && endDate
        ? {
            date: Between(new Date(startDate), new Date(endDate)),
          }
        : {};

    // Get KPIs
    const kpiMetrics = [
      'daily_active_users',
      'total_bookings',
      'total_revenue',
      'booking_conversion_rate',
    ];

    const kpis = await Promise.all(
      kpiMetrics.map(async (metricName) => {
        const latest = await this.analyticsRepository.findOne({
          where: { metricName, isActive: true, ...dateFilter },
          order: { date: 'DESC' },
        });

        if (!latest) {
          return {
            name: metricName,
            value: 0,
            unit: 'count',
            change: 0,
            trend: 'stable' as const,
          };
        }

        const trend: 'up' | 'down' | 'stable' =
          latest.changePercentage > 5
            ? 'up'
            : latest.changePercentage < -5
              ? 'down'
              : 'stable';

        return {
          name: metricName,
          value: latest.value,
          unit: latest.unit || 'count',
          change: latest.changePercentage || 0,
          trend,
        };
      }),
    );

    // Get trends for key metrics
    const trendMetrics = [
      'daily_active_users',
      'total_bookings',
      'total_revenue',
    ];
    const trends = await Promise.all(
      trendMetrics.map(async (metricName) => {
        try {
          const endDateStr = endDate || new Date().toISOString().split('T')[0];
          const startDateStr =
            startDate ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0];

          return await this.getMetricTrend(
            metricName,
            startDateStr,
            endDateStr,
          );
        } catch (error) {
          // Return empty trend if no data
          return {
            metricName,
            dataPoints: [],
            trend: {
              direction: 'stable' as const,
              percentage: 0,
              significance: 'low' as const,
            },
            summary: { min: 0, max: 0, avg: 0, median: 0, stdDev: 0 },
          };
        }
      }),
    );

    // Get alerts (metrics that exceed thresholds)
    const alertsQuery = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.alerts IS NOT NULL')
      .andWhere('analytics.isActive = true')
      .andWhere("(analytics.alerts->>'enabled')::boolean = true")
      .orderBy('analytics.updatedAt', 'DESC')
      .limit(10)
      .getMany();

    const alerts = alertsQuery.map((record) => {
      const thresholds = record.alerts?.thresholds;
      let type: 'critical' | 'warning' = 'warning';
      let message = `Metric ${record.metricName} requires attention`;

      if (thresholds?.critical) {
        if (
          (thresholds.critical.min && record.value < thresholds.critical.min) ||
          (thresholds.critical.max && record.value > thresholds.critical.max)
        ) {
          type = 'critical';
          message = `Critical threshold exceeded for ${record.metricName}: ${record.value}`;
        }
      } else if (thresholds?.warning) {
        if (
          (thresholds.warning.min && record.value < thresholds.warning.min) ||
          (thresholds.warning.max && record.value > thresholds.warning.max)
        ) {
          message = `Warning threshold exceeded for ${record.metricName}: ${record.value}`;
        }
      }

      return {
        metricName: record.metricName,
        type,
        message,
        timestamp: record.updatedAt,
      };
    });

    // Get summary statistics
    const totalMetrics = await this.analyticsRepository.count({
      where: { isActive: true },
    });
    const activeAlerts = alerts.filter(
      (alert) => alert.type === 'critical',
    ).length;

    const qualityQuery = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select(
        'AVG((analytics.quality->>"confidence")::numeric)',
        'avgConfidence',
      )
      .addSelect(
        'AVG((analytics.quality->>"completeness")::numeric)',
        'avgCompleteness',
      )
      .addSelect(
        'AVG((analytics.quality->>"accuracy")::numeric)',
        'avgAccuracy',
      )
      .addSelect(
        'AVG((analytics.quality->>"timeliness")::numeric)',
        'avgTimeliness',
      )
      .where('analytics.quality IS NOT NULL')
      .andWhere('analytics.isActive = true')
      .getRawOne();

    const dataQualityScore =
      ((parseFloat(qualityQuery?.avgConfidence) || 0) +
        (parseFloat(qualityQuery?.avgCompleteness) || 0) +
        (parseFloat(qualityQuery?.avgAccuracy) || 0) +
        (parseFloat(qualityQuery?.avgTimeliness) || 0)) /
      4;

    const lastUpdated = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select('MAX(analytics.updatedAt)', 'lastUpdated')
      .where('analytics.isActive = true')
      .getRawOne();

    return {
      kpis,
      trends,
      alerts,
      summary: {
        totalMetrics,
        activeAlerts,
        dataQualityScore,
        lastUpdated: lastUpdated?.lastUpdated || new Date(),
      },
    };
  }

  async getMetricsByType(type: AnalyticsType): Promise<AnalyticsEntity[]> {
    return await this.analyticsRepository.find({
      where: { type, isActive: true },
      order: { date: 'DESC' },
    });
  }

  async getMetricsByCategory(
    category: MetricCategory,
  ): Promise<AnalyticsEntity[]> {
    return await this.analyticsRepository.find({
      where: { category, isActive: true },
      order: { date: 'DESC' },
    });
  }

  async getMetricsByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AnalyticsEntity[]> {
    return await this.analyticsRepository.find({
      where: { entityType, entityId, isActive: true },
      order: { date: 'DESC' },
    });
  }

  async toggleMetricStatus(id: string): Promise<AnalyticsEntity> {
    const analytics = await this.findOne(id);
    analytics.isActive = !analytics.isActive;
    return await this.analyticsRepository.save(analytics);
  }

  async toggleMetricVisibility(id: string): Promise<AnalyticsEntity> {
    const analytics = await this.findOne(id);
    analytics.isPublic = !analytics.isPublic;
    return await this.analyticsRepository.save(analytics);
  }

  async getPredefinedMetrics(): Promise<typeof PREDEFINED_METRICS> {
    return PREDEFINED_METRICS;
  }

  async initializePredefinedMetrics(): Promise<AnalyticsEntity[]> {
    const results: AnalyticsEntity[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const [key, config] of Object.entries(PREDEFINED_METRICS)) {
      try {
        const existing = await this.analyticsRepository.findOne({
          where: {
            metricName: config.metricName,
            date: new Date(today),
            granularity: TimeGranularity.DAILY,
          },
        });

        if (!existing) {
          const analytics = await this.create({
            ...config,
            date: today,
            value: 0,
            granularity: TimeGranularity.DAILY,
            dataSource: 'system_initialization',
            schemaVersion: '1.0',
          });
          results.push(analytics);
        }
      } catch (error) {
        console.error(`Failed to initialize metric ${key}:`, error.message);
      }
    }

    return results;
  }
}

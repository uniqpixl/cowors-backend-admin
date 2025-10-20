import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateFraudAlertDto,
  FraudAlertQueryDto,
  UpdateFraudAlertDto,
} from '../dto/fraud-alert.dto';
import {
  FraudScoreQueryDto,
  RecalculateScoreDto,
  UpdateFraudScoreDto,
} from '../dto/fraud-score.dto';
import {
  FraudAlert,
  FraudAlertSeverity,
  FraudAlertStatus,
  FraudAlertType,
} from '../entities/fraud-alert.entity';
import {
  FraudScore,
  RiskLevel,
  ScoreFactors,
} from '../entities/fraud-score.entity';

export interface PaymentAnalysis {
  amount: number;
  currency: string;
  paymentMethod: string;
  userId: string;
  bookingId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
    coordinates?: [number, number];
  };
}

export interface UserBehaviorAnalysis {
  userId: string;
  action: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
}

export interface FraudAnalysisResult {
  riskScore: number;
  riskLevel: RiskLevel;
  flags: string[];
  recommendations: string[];
  shouldBlock: boolean;
  shouldAlert: boolean;
  confidence: number;
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  constructor(
    @InjectRepository(FraudAlert)
    private fraudAlertRepository: Repository<FraudAlert>,
    @InjectRepository(FraudScore)
    private fraudScoreRepository: Repository<FraudScore>,
  ) {}

  // Payment Fraud Detection
  async analyzePayment(
    analysis: PaymentAnalysis,
  ): Promise<FraudAnalysisResult> {
    try {
      const userId = analysis.userId;
      const userScore = await this.getUserFraudScore(userId);

      let riskScore = userScore?.overallScore || 0;
      const flags: string[] = [];
      const recommendations: string[] = [];

      // Amount-based analysis
      const amountRisk = await this.analyzePaymentAmount(analysis);
      riskScore += amountRisk.score;
      flags.push(...amountRisk.flags);

      // Frequency analysis
      const frequencyRisk = await this.analyzePaymentFrequency(analysis);
      riskScore += frequencyRisk.score;
      flags.push(...frequencyRisk.flags);

      // Payment method analysis
      const methodRisk = await this.analyzePaymentMethod(analysis);
      riskScore += methodRisk.score;
      flags.push(...methodRisk.flags);

      // Location analysis
      const locationRisk = await this.analyzeLocation(analysis);
      riskScore += locationRisk.score;
      flags.push(...locationRisk.flags);

      // Device analysis
      const deviceRisk = await this.analyzeDevice(analysis);
      riskScore += deviceRisk.score;
      flags.push(...deviceRisk.flags);

      // Normalize score to 0-100
      riskScore = Math.min(100, Math.max(0, riskScore));

      const riskLevel = this.calculateRiskLevel(riskScore);
      const shouldBlock = riskScore >= 80;
      const shouldAlert = riskScore >= 60;
      const confidence = this.calculateConfidence(flags.length, riskScore);

      // Generate recommendations
      if (riskScore >= 80) {
        recommendations.push('Block transaction immediately');
        recommendations.push('Require manual review');
      } else if (riskScore >= 60) {
        recommendations.push('Require additional verification');
        recommendations.push('Monitor closely');
      } else if (riskScore >= 40) {
        recommendations.push('Apply enhanced monitoring');
      }

      // Create fraud alert if necessary
      if (shouldAlert) {
        await this.createFraudAlert({
          userId: analysis.userId,
          bookingId: analysis.bookingId,
          type: FraudAlertType.PAYMENT_FRAUD,
          severity:
            riskScore >= 80
              ? FraudAlertSeverity.CRITICAL
              : FraudAlertSeverity.HIGH,
          title: `Suspicious payment detected`,
          description: `Payment of ${analysis.amount} ${analysis.currency} flagged with risk score ${riskScore}`,
          metadata: {
            analysis,
            flags,
            riskScore,
            recommendations,
          },
          riskScore,
          flags,
          ipAddress: analysis.ipAddress,
          userAgent: analysis.userAgent,
          location: analysis.location,
        });
      }

      return {
        riskScore,
        riskLevel,
        flags,
        recommendations,
        shouldBlock,
        shouldAlert,
        confidence,
      };
    } catch (error) {
      this.logger.error('Error analyzing payment:', error);
      throw error;
    }
  }

  // User Behavior Analysis
  async analyzeUserBehavior(
    analysis: UserBehaviorAnalysis,
  ): Promise<FraudAnalysisResult> {
    try {
      const userId = analysis.userId;
      const userScore = await this.getUserFraudScore(userId);

      let riskScore = userScore?.overallScore || 0;
      const flags: string[] = [];
      const recommendations: string[] = [];

      // Analyze specific behavior patterns
      switch (analysis.action) {
        case 'multiple_account_creation':
          const multiAccountRisk = await this.analyzeMultipleAccounts(analysis);
          riskScore += multiAccountRisk.score;
          flags.push(...multiAccountRisk.flags);
          break;

        case 'rapid_booking_attempts':
          const rapidBookingRisk = await this.analyzeRapidBooking(analysis);
          riskScore += rapidBookingRisk.score;
          flags.push(...rapidBookingRisk.flags);
          break;

        case 'suspicious_cancellation_pattern':
          const cancellationRisk =
            await this.analyzeCancellationPattern(analysis);
          riskScore += cancellationRisk.score;
          flags.push(...cancellationRisk.flags);
          break;

        case 'unusual_login_pattern':
          const loginRisk = await this.analyzeLoginPattern(analysis);
          riskScore += loginRisk.score;
          flags.push(...loginRisk.flags);
          break;
      }

      // Normalize score
      riskScore = Math.min(100, Math.max(0, riskScore));

      const riskLevel = this.calculateRiskLevel(riskScore);
      const shouldBlock = riskScore >= 85;
      const shouldAlert = riskScore >= 65;
      const confidence = this.calculateConfidence(flags.length, riskScore);

      // Create fraud alert if necessary
      if (shouldAlert) {
        await this.createFraudAlert({
          userId: analysis.userId,
          type: FraudAlertType.USER_BEHAVIOR,
          severity:
            riskScore >= 85
              ? FraudAlertSeverity.CRITICAL
              : FraudAlertSeverity.HIGH,
          title: `Suspicious user behavior detected`,
          description: `User behavior '${analysis.action}' flagged with risk score ${riskScore}`,
          metadata: {
            analysis,
            flags,
            riskScore,
            recommendations,
          },
          riskScore,
          flags,
          ipAddress: analysis.ipAddress,
          userAgent: analysis.userAgent,
        });
      }

      return {
        riskScore,
        riskLevel,
        flags,
        recommendations,
        shouldBlock,
        shouldAlert,
        confidence,
      };
    } catch (error) {
      this.logger.error('Error analyzing user behavior:', error);
      throw error;
    }
  }

  // Fraud Score Management
  async calculateUserFraudScore(userId: string): Promise<FraudScore> {
    try {
      const scoreFactors: ScoreFactors = {
        paymentHistory: await this.calculatePaymentHistoryScore(userId),
        bookingBehavior: await this.calculateBookingBehaviorScore(userId),
        identityVerification: await this.calculateVerificationScore(userId),
        deviceTrust: await this.calculateDeviceScore(userId),
        locationConsistency: await this.calculateLocationScore(userId),
        socialSignals: await this.calculateNetworkScore(userId),
      };

      const overallScore = this.calculateOverallScore(scoreFactors);
      const riskLevel = this.calculateRiskLevel(overallScore);
      const behaviorMetrics = await this.calculateBehaviorMetrics(userId);
      const activeFlags = await this.calculateActiveFlags(userId, scoreFactors);

      let fraudScore = await this.fraudScoreRepository.findOne({
        where: { userId },
      });

      if (fraudScore) {
        fraudScore.overallScore = overallScore;
        fraudScore.riskLevel = riskLevel;
        fraudScore.scoreFactors = scoreFactors;
        fraudScore.behaviorMetrics = behaviorMetrics;
        fraudScore.activeFlags = activeFlags;
        fraudScore.lastCalculatedAt = new Date();
        fraudScore.nextCalculationDue = new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        );
        await this.fraudScoreRepository.save(fraudScore);
      } else {
        fraudScore = this.fraudScoreRepository.create({
          userId,
          overallScore,
          riskLevel,
          scoreFactors,
          behaviorMetrics,
          activeFlags,
          lastCalculatedAt: new Date(),
          nextCalculationDue: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        fraudScore = await this.fraudScoreRepository.save(fraudScore);
      }

      this.logger.log(
        `Updated fraud score for user ${userId}: ${overallScore} (${riskLevel})`,
      );
      return fraudScore;
    } catch (error) {
      this.logger.error('Error calculating fraud score:', error);
      throw error;
    }
  }

  // CRUD Operations for Fraud Alerts
  async createFraudAlert(createDto: CreateFraudAlertDto): Promise<FraudAlert> {
    try {
      const alert = this.fraudAlertRepository.create(createDto);
      return await this.fraudAlertRepository.save(alert);
    } catch (error) {
      this.logger.error('Failed to create fraud alert', error.stack);
      throw error;
    }
  }

  async getFraudAlerts(query: FraudAlertQueryDto): Promise<{
    alerts: FraudAlert[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        severity,
        type,
        userId,
        assignedTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = query;

      const { startDate, endDate } = query as any;

      const queryBuilder =
        this.fraudAlertRepository.createQueryBuilder('alert');

      if (status) queryBuilder.andWhere('alert.status = :status', { status });
      if (severity)
        queryBuilder.andWhere('alert.severity = :severity', { severity });
      if (type) queryBuilder.andWhere('alert.type = :type', { type });
      if (userId) queryBuilder.andWhere('alert.userId = :userId', { userId });
      if (assignedTo)
        queryBuilder.andWhere('alert.assignedTo = :assignedTo', { assignedTo });
      if (startDate)
        queryBuilder.andWhere('alert.createdAt >= :startDate', {
          startDate: new Date(startDate),
        });
      if (endDate)
        queryBuilder.andWhere('alert.createdAt <= :endDate', {
          endDate: new Date(endDate),
        });

      queryBuilder.orderBy('alert.createdAt', 'DESC');
      queryBuilder.skip((page - 1) * limit).take(limit);

      const [alerts, total] = await queryBuilder.getManyAndCount();

      return { alerts, total, page, limit };
    } catch (error) {
      this.logger.error('Failed to get fraud alerts', error.stack);
      throw error;
    }
  }

  async updateFraudAlert(
    id: string,
    updateDto: UpdateFraudAlertDto,
  ): Promise<FraudAlert> {
    try {
      await this.fraudAlertRepository.update(id, updateDto);
      const alert = await this.fraudAlertRepository.findOne({ where: { id } });
      if (!alert) {
        throw new Error('Fraud alert not found');
      }
      return alert;
    } catch (error) {
      this.logger.error('Failed to update fraud alert', error.stack);
      throw error;
    }
  }

  async getFraudAlertById(id: string): Promise<FraudAlert> {
    const alert = await this.fraudAlertRepository.findOne({ where: { id } });
    if (!alert) {
      throw new Error('Fraud alert not found');
    }
    return alert;
  }

  async addAlertAction(
    id: string,
    actionDto: any,
    userId: string,
  ): Promise<FraudAlert> {
    const alert = await this.fraudAlertRepository.findOne({ where: { id } });
    if (!alert) {
      throw new Error('Fraud alert not found');
    }

    alert.actionHistory.push({
      action: actionDto.action,
      userId,
      timestamp: new Date(),
      notes: actionDto.notes,
    });

    return await this.fraudAlertRepository.save(alert);
  }

  async getFraudScores(query: FraudScoreQueryDto): Promise<{
    scores: FraudScore[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      userId,
      riskLevel,
      minScore,
      maxScore,
    } = query;

    const { isBlacklisted, isWhitelisted } = query as any;

    const queryBuilder = this.fraudScoreRepository.createQueryBuilder('score');

    if (riskLevel)
      queryBuilder.andWhere('score.riskLevel = :riskLevel', { riskLevel });
    if (minScore !== undefined)
      queryBuilder.andWhere('score.overallScore >= :minScore', { minScore });
    if (maxScore !== undefined)
      queryBuilder.andWhere('score.overallScore <= :maxScore', { maxScore });
    if (isBlacklisted !== undefined)
      queryBuilder.andWhere('score.isBlacklisted = :isBlacklisted', {
        isBlacklisted,
      });
    if (isWhitelisted !== undefined)
      queryBuilder.andWhere('score.isWhitelisted = :isWhitelisted', {
        isWhitelisted,
      });

    queryBuilder.orderBy('score.lastCalculatedAt', 'DESC');
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [scores, total] = await queryBuilder.getManyAndCount();

    return { scores, total, page, limit };
  }

  async updateUserFraudScore(
    userId: string,
    updateDto: UpdateFraudScoreDto,
  ): Promise<FraudScore> {
    let score = await this.fraudScoreRepository.findOne({ where: { userId } });

    if (!score) {
      score = this.fraudScoreRepository.create({
        userId,
        ...updateDto,
        lastCalculatedAt: new Date(),
      });
    } else {
      Object.assign(score, updateDto);
      score.lastCalculatedAt = new Date();
    }

    return await this.fraudScoreRepository.save(score);
  }

  async getFraudAlertStats(query: any): Promise<any> {
    const queryBuilder = this.fraudAlertRepository.createQueryBuilder('alert');

    if (query.severity)
      queryBuilder.andWhere('alert.severity = :severity', {
        severity: query.severity,
      });
    if (query.status)
      queryBuilder.andWhere('alert.status = :status', { status: query.status });
    if (query.type)
      queryBuilder.andWhere('alert.type = :type', { type: query.type });

    const [totalAlerts, avgRiskScore] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.select('AVG(alert.riskScore)', 'avgRiskScore').getRawOne(),
    ]);

    const severityStats = await this.fraudAlertRepository
      .createQueryBuilder('alert')
      .select('alert.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('alert.severity')
      .getRawMany();

    const statusStats = await this.fraudAlertRepository
      .createQueryBuilder('alert')
      .select('alert.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('alert.status')
      .getRawMany();

    return {
      totalAlerts,
      avgRiskScore: avgRiskScore?.avgRiskScore || 0,
      severityBreakdown: severityStats,
      statusBreakdown: statusStats,
    };
  }

  async getFraudScoreStats(query: any): Promise<any> {
    const queryBuilder = this.fraudScoreRepository.createQueryBuilder('score');

    if (query.riskLevel)
      queryBuilder.andWhere('score.riskLevel = :riskLevel', {
        riskLevel: query.riskLevel,
      });

    const [totalUsers, avgScore, listStats] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.select('AVG(score.overallScore)', 'avgScore').getRawOne(),
      this.fraudScoreRepository
        .createQueryBuilder('score')
        .select(
          'SUM(CASE WHEN score.isBlacklisted = true THEN 1 ELSE 0 END)',
          'blacklistedUsers',
        )
        .addSelect(
          'SUM(CASE WHEN score.isWhitelisted = true THEN 1 ELSE 0 END)',
          'whitelistedUsers',
        )
        .getRawOne(),
    ]);

    const riskLevelStats = await this.fraudScoreRepository
      .createQueryBuilder('score')
      .select('score.riskLevel', 'riskLevel')
      .addSelect('COUNT(*)', 'count')
      .groupBy('score.riskLevel')
      .getRawMany();

    return {
      totalUsers,
      avgScore: avgScore?.avgScore || 0,
      riskLevelBreakdown: riskLevelStats,
      blacklistedUsers: parseInt(listStats?.blacklistedUsers || '0'),
      whitelistedUsers: parseInt(listStats?.whitelistedUsers || '0'),
    };
  }

  async getUserFraudScore(userId: string): Promise<FraudScore | null> {
    return this.fraudScoreRepository.findOne({ where: { userId } });
  }

  // Private helper methods
  private async analyzePaymentAmount(
    analysis: PaymentAnalysis,
  ): Promise<{ score: number; flags: string[] }> {
    const flags: string[] = [];
    let score = 0;

    // Check for unusually high amounts
    if (analysis.amount > 10000) {
      score += 20;
      flags.push('high_amount');
    } else if (analysis.amount > 5000) {
      score += 10;
      flags.push('elevated_amount');
    }

    // Check for round numbers (potential money laundering)
    if (analysis.amount % 1000 === 0 && analysis.amount >= 1000) {
      score += 5;
      flags.push('round_amount');
    }

    return { score, flags };
  }

  private async analyzePaymentFrequency(
    analysis: PaymentAnalysis,
  ): Promise<{ score: number; flags: string[] }> {
    const flags: string[] = [];
    let score = 0;

    // Check recent payment frequency for this user
    const recentPayments = await this.fraudAlertRepository
      .createQueryBuilder('alert')
      .where('alert.userId = :userId', { userId: analysis.userId })
      .andWhere('alert.type = :type', { type: FraudAlertType.PAYMENT_FRAUD })
      .andWhere('alert.createdAt >= :date', {
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      })
      .getCount();

    if (recentPayments > 5) {
      score += 25;
      flags.push('high_frequency');
    } else if (recentPayments > 3) {
      score += 15;
      flags.push('elevated_frequency');
    }

    return { score, flags };
  }

  private async analyzePaymentMethod(
    analysis: PaymentAnalysis,
  ): Promise<{ score: number; flags: string[] }> {
    const flags: string[] = [];
    let score = 0;

    // Higher risk for certain payment methods
    if (analysis.paymentMethod === 'cryptocurrency') {
      score += 15;
      flags.push('crypto_payment');
    } else if (analysis.paymentMethod === 'prepaid_card') {
      score += 10;
      flags.push('prepaid_card');
    }

    return { score, flags };
  }

  private async analyzeLocation(
    analysis: PaymentAnalysis,
  ): Promise<{ score: number; flags: string[] }> {
    const flags: string[] = [];
    let score = 0;

    if (analysis.location?.country) {
      // Check against high-risk countries (simplified example)
      const highRiskCountries = ['XX', 'YY']; // Replace with actual list
      if (highRiskCountries.includes(analysis.location.country)) {
        score += 20;
        flags.push('high_risk_country');
      }
    }

    return { score, flags };
  }

  private async analyzeDevice(
    analysis: PaymentAnalysis,
  ): Promise<{ score: number; flags: string[] }> {
    const flags: string[] = [];
    let score = 0;

    // Analyze user agent for suspicious patterns
    if (analysis.userAgent) {
      if (
        analysis.userAgent.includes('bot') ||
        analysis.userAgent.includes('crawler')
      ) {
        score += 30;
        flags.push('bot_user_agent');
      }
    }

    return { score, flags };
  }

  private async analyzeMultipleAccounts(
    analysis: UserBehaviorAnalysis,
  ): Promise<{ score: number; flags: string[] }> {
    // Implementation for multiple account detection
    return { score: 25, flags: ['multiple_accounts'] };
  }

  private async analyzeRapidBooking(
    analysis: UserBehaviorAnalysis,
  ): Promise<{ score: number; flags: string[] }> {
    // Implementation for rapid booking detection
    return { score: 20, flags: ['rapid_booking'] };
  }

  private async analyzeCancellationPattern(
    analysis: UserBehaviorAnalysis,
  ): Promise<{ score: number; flags: string[] }> {
    // Implementation for cancellation pattern analysis
    return { score: 15, flags: ['suspicious_cancellation'] };
  }

  private async analyzeLoginPattern(
    analysis: UserBehaviorAnalysis,
  ): Promise<{ score: number; flags: string[] }> {
    // Implementation for login pattern analysis
    return { score: 10, flags: ['unusual_login'] };
  }

  private async calculatePaymentHistoryScore(userId: string): Promise<number> {
    // Implementation for payment history scoring
    return 10;
  }

  private async calculateBookingBehaviorScore(userId: string): Promise<number> {
    // Implementation for booking behavior scoring
    return 10;
  }

  private async calculateAccountAgeScore(userId: string): Promise<number> {
    // Implementation for account age scoring
    return 5;
  }

  private async calculateVerificationScore(userId: string): Promise<number> {
    // Implementation for verification status scoring
    return 5;
  }

  private async calculateDeviceScore(userId: string): Promise<number> {
    // Implementation for device fingerprint scoring
    return 10;
  }

  private async calculateLocationScore(userId: string): Promise<number> {
    // Implementation for location consistency scoring
    return 10;
  }

  private async calculateVelocityScore(userId: string): Promise<number> {
    // Implementation for velocity checks scoring
    return 15;
  }

  private async calculateNetworkScore(userId: string): Promise<number> {
    // Implementation for network analysis scoring
    return 10;
  }

  private calculateOverallScore(factors: any): number {
    const weights = {
      paymentHistory: 0.2,
      bookingBehavior: 0.15,
      accountAge: 0.1,
      verificationStatus: 0.1,
      deviceFingerprint: 0.15,
      locationConsistency: 0.1,
      velocityChecks: 0.15,
      networkAnalysis: 0.05,
    };

    return Math.round(
      factors.paymentHistory * weights.paymentHistory +
        factors.bookingBehavior * weights.bookingBehavior +
        factors.accountAge * weights.accountAge +
        factors.verificationStatus * weights.verificationStatus +
        factors.deviceFingerprint * weights.deviceFingerprint +
        factors.locationConsistency * weights.locationConsistency +
        factors.velocityChecks * weights.velocityChecks +
        factors.networkAnalysis * weights.networkAnalysis,
    );
  }

  private calculateRiskLevel(score: number): RiskLevel {
    if (score >= 80) return RiskLevel.VERY_HIGH;
    if (score >= 60) return RiskLevel.HIGH;
    if (score >= 40) return RiskLevel.MEDIUM;
    if (score >= 20) return RiskLevel.LOW;
    return RiskLevel.VERY_LOW;
  }

  private calculateConfidence(flagCount: number, riskScore: number): number {
    const baseConfidence = Math.min(90, riskScore);
    const flagBonus = Math.min(10, flagCount * 2);
    return Math.min(100, baseConfidence + flagBonus);
  }

  private async calculateBehaviorMetrics(userId: string): Promise<any> {
    // Implementation for calculating behavior metrics
    return {
      totalBookings: 0,
      cancelledBookings: 0,
      failedPayments: 0,
      disputedPayments: 0,
      averageBookingValue: 0,
      bookingFrequency: 0,
      lastActivityDate: new Date(),
      accountCreatedDays: 0,
      verifiedEmail: false,
      verifiedPhone: false,
      kycCompleted: false,
      deviceCount: 1,
      locationCount: 1,
      suspiciousActivities: 0,
    };
  }

  private async calculateActiveFlags(
    userId: string,
    factors: any,
  ): Promise<string[]> {
    const flags: string[] = [];

    if (factors.paymentHistory > 70) flags.push('high_payment_risk');
    if (factors.velocityChecks > 70) flags.push('velocity_risk');
    if (factors.deviceFingerprint > 70) flags.push('device_risk');

    return flags;
  }
}

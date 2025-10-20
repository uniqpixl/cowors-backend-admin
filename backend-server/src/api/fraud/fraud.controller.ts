import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import {
  AddActionDto,
  CreateFraudAlertDto,
  FraudAlertQueryDto,
  FraudAlertStatsDto,
  UpdateFraudAlertDto,
} from './dto/fraud-alert.dto';
import {
  BulkRecalculateDto,
  FraudScoreQueryDto,
  FraudScoreStatsDto,
  RecalculateScoreDto,
  UpdateFraudScoreDto,
} from './dto/fraud-score.dto';
import {
  FraudDetectionService,
  PaymentAnalysis,
  UserBehaviorAnalysis,
} from './services/fraud-detection.service';

@ApiTags('fraud')
@Controller('fraud')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FraudController {
  private readonly logger = new Logger(FraudController.name);

  constructor(private readonly fraudDetectionService: FraudDetectionService) {}

  // Payment Analysis Endpoints
  @Post('analyze/payment')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Analyze payment for fraud detection' })
  @ApiResponse({ status: 200, description: 'Payment analysis completed' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  async analyzePayment(@Body() analysis: PaymentAnalysis) {
    try {
      const result = await this.fraudDetectionService.analyzePayment(analysis);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('Error analyzing payment:', error);
      throw new HttpException(
        'Failed to analyze payment',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('analyze/behavior')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Analyze user behavior for fraud detection' })
  @ApiResponse({ status: 200, description: 'Behavior analysis completed' })
  @ApiResponse({ status: 400, description: 'Invalid behavior data' })
  async analyzeUserBehavior(@Body() analysis: UserBehaviorAnalysis) {
    try {
      const result =
        await this.fraudDetectionService.analyzeUserBehavior(analysis);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('Error analyzing user behavior:', error);
      throw new HttpException(
        'Failed to analyze user behavior',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Fraud Alert Management
  @Post('alerts')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create a new fraud alert' })
  @ApiResponse({ status: 201, description: 'Fraud alert created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid alert data' })
  async createFraudAlert(@Body() createAlertDto: CreateFraudAlertDto) {
    try {
      const alert =
        await this.fraudDetectionService.createFraudAlert(createAlertDto);
      return {
        success: true,
        data: alert,
      };
    } catch (error) {
      this.logger.error('Error creating fraud alert:', error);
      throw new HttpException(
        'Failed to create fraud alert',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('alerts')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get fraud alerts with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Fraud alerts retrieved successfully',
  })
  async getFraudAlerts(@Query() query: FraudAlertQueryDto) {
    try {
      const result = await this.fraudDetectionService.getFraudAlerts(query);
      return {
        success: true,
        data: result.alerts,
        pagination: {
          total: result.total,
          page: query.page || 1,
          limit: query.limit || 10,
          totalPages: Math.ceil(result.total / (query.limit || 10)),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching fraud alerts:', error);
      throw new HttpException(
        'Failed to fetch fraud alerts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('alerts/:id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get fraud alert by ID' })
  @ApiResponse({
    status: 200,
    description: 'Fraud alert retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Fraud alert not found' })
  async getFraudAlert(@Param('id') id: string) {
    try {
      if (!id || typeof id !== 'string') {
        throw new HttpException('Invalid alert ID', HttpStatus.BAD_REQUEST);
      }

      const alert = await this.fraudDetectionService.getFraudAlertById(id);
      if (!alert) {
        throw new HttpException('Fraud alert not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: alert,
      };
    } catch (error) {
      this.logger.error('Error fetching fraud alert:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch fraud alert',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('alerts/:id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update fraud alert' })
  @ApiResponse({ status: 200, description: 'Fraud alert updated successfully' })
  @ApiResponse({ status: 404, description: 'Fraud alert not found' })
  async updateFraudAlert(
    @Param('id') id: string,
    @Body() updateAlertDto: UpdateFraudAlertDto,
  ) {
    try {
      if (!id || typeof id !== 'string') {
        throw new HttpException('Invalid alert ID', HttpStatus.BAD_REQUEST);
      }

      const alert = await this.fraudDetectionService.updateFraudAlert(
        id,
        updateAlertDto,
      );
      if (!alert) {
        throw new HttpException('Fraud alert not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: alert,
      };
    } catch (error) {
      this.logger.error('Error updating fraud alert:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update fraud alert',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('alerts/:id/actions')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Add action to fraud alert' })
  @ApiResponse({ status: 200, description: 'Action added successfully' })
  @ApiResponse({ status: 404, description: 'Fraud alert not found' })
  async addAlertAction(
    @Param('id') id: string,
    @Body() addActionDto: AddActionDto,
    @Request() req: any,
  ) {
    try {
      if (!id || typeof id !== 'string') {
        throw new HttpException('Invalid alert ID', HttpStatus.BAD_REQUEST);
      }

      const alert = await this.fraudDetectionService.addAlertAction(
        id,
        addActionDto,
        req.user.id,
      );
      if (!alert) {
        throw new HttpException('Fraud alert not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: alert,
      };
    } catch (error) {
      this.logger.error('Error adding alert action:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to add alert action',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Fraud Score Management
  @Get('scores')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get fraud scores with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Fraud scores retrieved successfully',
  })
  async getFraudScores(@Query() query: FraudScoreQueryDto) {
    try {
      const filter: any = {};

      if (query.userId) filter.userId = query.userId;
      if (query.riskLevel) filter.riskLevel = query.riskLevel;
      if (query.minScore !== undefined)
        filter.overallScore = { $gte: query.minScore };
      if (query.maxScore !== undefined) {
        filter.overallScore = filter.overallScore || {};
        filter.overallScore.$lte = query.maxScore;
      }

      const result = await this.fraudDetectionService.getFraudScores(query);
      return {
        success: true,
        data: result.scores,
        pagination: {
          total: result.total,
          page: query.page || 1,
          limit: query.limit || 10,
          totalPages: Math.ceil(result.total / (query.limit || 10)),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching fraud scores:', error);
      throw new HttpException(
        'Failed to fetch fraud scores',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('scores/user/:userId')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get user fraud score' })
  @ApiResponse({
    status: 200,
    description: 'User fraud score retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User fraud score not found' })
  async getUserFraudScore(@Param('userId') userId: string) {
    try {
      if (!userId || typeof userId !== 'string') {
        throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);
      }

      const score = await this.fraudDetectionService.getUserFraudScore(userId);

      if (!score) {
        // Calculate score if it doesn't exist
        const calculatedScore =
          await this.fraudDetectionService.calculateUserFraudScore(userId);
        return {
          success: true,
          data: calculatedScore,
        };
      }

      return {
        success: true,
        data: score,
      };
    } catch (error) {
      this.logger.error('Error fetching user fraud score:', error);
      throw new HttpException(
        'Failed to fetch user fraud score',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('scores/user/:userId')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update user fraud score' })
  @ApiResponse({
    status: 200,
    description: 'User fraud score updated successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserFraudScore(
    @Param('userId') userId: string,
    @Body() updateDto: UpdateFraudScoreDto,
  ) {
    try {
      if (!userId || typeof userId !== 'string') {
        throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);
      }

      const score = await this.fraudDetectionService.updateUserFraudScore(
        userId,
        updateDto,
      );

      return {
        success: true,
        data: score,
      };
    } catch (error) {
      this.logger.error('Error updating user fraud score:', error);
      throw new HttpException(
        'Failed to update user fraud score',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('scores/recalculate')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Recalculate fraud score for a user' })
  @ApiResponse({
    status: 200,
    description: 'Fraud score recalculated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid user ID' })
  async recalculateFraudScore(@Body() recalculateDto: RecalculateScoreDto) {
    try {
      if (!recalculateDto.userId || typeof recalculateDto.userId !== 'string') {
        throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);
      }

      const score = await this.fraudDetectionService.calculateUserFraudScore(
        recalculateDto.userId,
      );

      return {
        success: true,
        data: score,
      };
    } catch (error) {
      this.logger.error('Error recalculating fraud score:', error);
      throw new HttpException(
        'Failed to recalculate fraud score',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('scores/bulk-recalculate')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Bulk recalculate fraud scores' })
  @ApiResponse({
    status: 200,
    description: 'Bulk recalculation initiated successfully',
  })
  async bulkRecalculateFraudScores(@Body() bulkDto: BulkRecalculateDto) {
    try {
      const { userIds } = bulkDto;
      const results = [];

      // Process in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const batchPromises = batch.map(async (userId) => {
          try {
            const score =
              await this.fraudDetectionService.calculateUserFraudScore(
                userIds[i],
              );
            results.push({ userId: userIds[i], success: true, score });
          } catch (error) {
            this.logger.error(
              `Error recalculating score for user ${userId}:`,
              error,
            );
            results.push({ userId, success: false, error: error.message });
          }
        });
        await Promise.all(batchPromises);
      }

      return {
        success: true,
        data: {
          processed: results.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
          results,
        },
      };
    } catch (error) {
      this.logger.error('Error in bulk recalculation:', error);
      throw new HttpException(
        'Failed to perform bulk recalculation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Statistics Endpoints
  @Get('alerts/stats')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get fraud alert statistics' })
  @ApiResponse({
    status: 200,
    description: 'Fraud alert statistics retrieved successfully',
  })
  async getFraudAlertStats(@Query() query: FraudAlertStatsDto) {
    try {
      const stats = await this.fraudDetectionService.getFraudAlertStats(query);
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error('Error fetching fraud alert stats:', error);
      throw new HttpException(
        'Failed to fetch fraud alert statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('scores/stats')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get fraud score statistics' })
  @ApiResponse({
    status: 200,
    description: 'Fraud score statistics retrieved successfully',
  })
  async getFraudScoreStats(@Query() query: FraudScoreStatsDto) {
    try {
      const stats = await this.fraudDetectionService.getFraudScoreStats(query);
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error('Error fetching fraud score stats:', error);
      throw new HttpException(
        'Failed to fetch fraud score statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

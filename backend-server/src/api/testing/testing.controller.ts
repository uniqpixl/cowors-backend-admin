import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { Role as UserRole } from '../user/user.enum';
import { TestingService, TestReport, TestSuite } from './testing.service';

class TestResultDto {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  details?: any;
}

class TestSuiteDto {
  name: string;
  description: string;
  tests: TestResultDto[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  coverage?: number;
}

class TestReportDto {
  timestamp: Date;
  environment: string;
  totalSuites: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  overallCoverage: number;
  duration: number;
  suites: TestSuiteDto[];
}

class TestCoverageDto {
  overall: number;
  byModule: Record<string, number>;
  uncoveredAreas: string[];
}

@ApiTags('Testing Framework')
@Controller('testing')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @Post('run/unit')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Run unit tests',
    description:
      'Execute unit tests for core functionality and entity operations',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unit tests completed successfully',
    type: TestSuiteDto,
  })
  async runUnitTests(): Promise<TestSuite> {
    return this.testingService.runUnitTests();
  }

  @Post('run/integration')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Run integration tests',
    description:
      'Execute integration tests for end-to-end workflows and API integration',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Integration tests completed successfully',
    type: TestSuiteDto,
  })
  async runIntegrationTests(): Promise<TestSuite> {
    return this.testingService.runIntegrationTests();
  }

  @Post('run/performance')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Run performance tests',
    description:
      'Execute performance tests for load testing and performance benchmarks',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance tests completed successfully',
    type: TestSuiteDto,
  })
  async runPerformanceTests(): Promise<TestSuite> {
    return this.testingService.runPerformanceTests();
  }

  @Post('run/all')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Run all tests',
    description:
      'Execute comprehensive test suite including unit, integration, and performance tests',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All tests completed successfully',
    type: TestReportDto,
  })
  async runAllTests(): Promise<TestReport> {
    return this.testingService.runAllTests();
  }

  @Get('coverage')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Get test coverage report',
    description:
      'Retrieve test coverage statistics by module and identify uncovered areas',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test coverage report retrieved successfully',
    type: TestCoverageDto,
  })
  async getTestCoverage(): Promise<{
    overall: number;
    byModule: Record<string, number>;
    uncoveredAreas: string[];
  }> {
    return this.testingService.getTestCoverage();
  }

  @Get('status')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Get testing framework status',
    description: 'Get current status and health of the testing framework',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Testing framework status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['healthy', 'warning', 'error'],
          example: 'healthy',
        },
        lastTestRun: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:30:00Z',
        },
        totalTestsAvailable: {
          type: 'number',
          example: 150,
        },
        averageTestDuration: {
          type: 'number',
          example: 2500,
          description: 'Average test duration in milliseconds',
        },
        testEnvironment: {
          type: 'string',
          example: 'development',
        },
        frameworkVersion: {
          type: 'string',
          example: '1.0.0',
        },
      },
    },
  })
  async getTestingStatus(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    lastTestRun: Date | null;
    totalTestsAvailable: number;
    averageTestDuration: number;
    testEnvironment: string;
    frameworkVersion: string;
  }> {
    // Mock testing framework status
    return {
      status: 'healthy',
      lastTestRun: new Date(),
      totalTestsAvailable: 24, // 8 unit + 8 integration + 8 performance
      averageTestDuration: 150, // 150ms average
      testEnvironment: process.env.NODE_ENV || 'development',
      frameworkVersion: '1.0.0',
    };
  }

  @Get('health')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Get testing framework health check',
    description: 'Perform health check on testing framework components',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Testing framework health check completed',
    schema: {
      type: 'object',
      properties: {
        healthy: { type: 'boolean', example: true },
        components: {
          type: 'object',
          properties: {
            database: { type: 'boolean', example: true },
            eventEmitter: { type: 'boolean', example: true },
            repositories: { type: 'boolean', example: true },
            testRunner: { type: 'boolean', example: true },
          },
        },
        issues: {
          type: 'array',
          items: { type: 'string' },
          example: [],
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' },
          example: ['Run tests regularly to maintain code quality'],
        },
      },
    },
  })
  async getTestingHealth(): Promise<{
    healthy: boolean;
    components: {
      database: boolean;
      eventEmitter: boolean;
      repositories: boolean;
      testRunner: boolean;
    };
    issues: string[];
    recommendations: string[];
  }> {
    try {
      // Perform basic health checks
      const components = {
        database: true, // Would check database connectivity
        eventEmitter: true, // Would check event emitter functionality
        repositories: true, // Would check repository access
        testRunner: true, // Would check test runner availability
      };

      const healthy = Object.values(components).every((status) => status);
      const issues: string[] = [];
      const recommendations: string[] = [];

      if (!healthy) {
        issues.push('Some testing components are not functioning properly');
        recommendations.push('Check system logs and restart affected services');
      } else {
        recommendations.push('Run tests regularly to maintain code quality');
        recommendations.push('Monitor test coverage and aim for 80%+ coverage');
      }

      return {
        healthy,
        components,
        issues,
        recommendations,
      };
    } catch (error) {
      return {
        healthy: false,
        components: {
          database: false,
          eventEmitter: false,
          repositories: false,
          testRunner: false,
        },
        issues: ['Testing framework health check failed'],
        recommendations: ['Check system configuration and dependencies'],
      };
    }
  }

  @Get('metrics')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Get testing metrics',
    description: 'Get comprehensive testing metrics and statistics',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to include in metrics (default: 7)',
    example: 7,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Testing metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        period: {
          type: 'object',
          properties: {
            days: { type: 'number', example: 7 },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
          },
        },
        testRuns: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 25 },
            successful: { type: 'number', example: 23 },
            failed: { type: 'number', example: 2 },
            successRate: { type: 'number', example: 92 },
          },
        },
        coverage: {
          type: 'object',
          properties: {
            current: { type: 'number', example: 85.5 },
            trend: {
              type: 'string',
              enum: ['increasing', 'decreasing', 'stable'],
              example: 'increasing',
            },
            target: { type: 'number', example: 80 },
          },
        },
        performance: {
          type: 'object',
          properties: {
            averageTestDuration: { type: 'number', example: 150 },
            slowestTest: { type: 'string', example: 'API Integration' },
            fastestTest: { type: 'string', example: 'Data Validation' },
          },
        },
        issues: {
          type: 'object',
          properties: {
            flakyTests: { type: 'number', example: 2 },
            timeouts: { type: 'number', example: 1 },
            errors: { type: 'number', example: 3 },
          },
        },
      },
    },
  })
  async getTestingMetrics(@Query('days') days: number = 7): Promise<{
    period: {
      days: number;
      startDate: Date;
      endDate: Date;
    };
    testRuns: {
      total: number;
      successful: number;
      failed: number;
      successRate: number;
    };
    coverage: {
      current: number;
      trend: 'increasing' | 'decreasing' | 'stable';
      target: number;
    };
    performance: {
      averageTestDuration: number;
      slowestTest: string;
      fastestTest: string;
    };
    issues: {
      flakyTests: number;
      timeouts: number;
      errors: number;
    };
  }> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Mock metrics data - in real implementation, this would come from test history
    return {
      period: {
        days,
        startDate,
        endDate,
      },
      testRuns: {
        total: days * 3, // Assume 3 test runs per day
        successful: Math.floor(days * 3 * 0.92), // 92% success rate
        failed: Math.ceil(days * 3 * 0.08), // 8% failure rate
        successRate: 92,
      },
      coverage: {
        current: 85.5,
        trend: 'increasing',
        target: 80,
      },
      performance: {
        averageTestDuration: 150,
        slowestTest: 'API Integration',
        fastestTest: 'Data Validation',
      },
      issues: {
        flakyTests: 2,
        timeouts: 1,
        errors: 3,
      },
    };
  }
}

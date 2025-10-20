import { AuthService } from '@/auth/auth.service';
import { GlobalConfig } from '@/config/config.type';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheckService,
  HttpHealthIndicator,
  MicroserviceHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthCheckService;
  let configServiceValue: Partial<
    Record<keyof ConfigService<GlobalConfig>, jest.Mock>
  >;
  let healthCheckServiceValue: Partial<
    Record<keyof HealthCheckService, jest.Mock>
  >;
  let httpUseValue: Partial<Record<keyof HttpHealthIndicator, jest.Mock>>;
  let dbUseValue: Partial<Record<keyof TypeOrmHealthIndicator, jest.Mock>>;
  let microServiceValue: Partial<
    Record<keyof MicroserviceHealthIndicator, jest.Mock>
  >;
  let authServiceValue: Partial<Record<keyof AuthService, jest.Mock>>;

  beforeAll(async () => {
    configServiceValue = {
      get: jest.fn(),
    };

    healthCheckServiceValue = {
      check: jest.fn(),
    };

    httpUseValue = {
      pingCheck: jest.fn(),
    };

    dbUseValue = {
      pingCheck: jest.fn(),
    };

    microServiceValue = {
      pingCheck: jest.fn(),
    };

    authServiceValue = {
      createBasicAuthHeaders: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: ConfigService,
          useValue: configServiceValue,
        },
        {
          provide: HealthCheckService,
          useValue: healthCheckServiceValue,
        },
        {
          provide: HttpHealthIndicator,
          useValue: httpUseValue,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: dbUseValue,
        },
        {
          provide: MicroserviceHealthIndicator,
          useValue: microServiceValue,
        },
        {
          provide: AuthService,
          useValue: authServiceValue,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthCheckService>(HealthCheckService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('check', () => {
    it('should return health check result', async () => {
      const healthCheckResult = {
        status: 'ok',
        info: {
          db: {
            status: 'up',
          },
          redis: { status: 'up' },
          http: {
            status: 'up',
          },
        },
        error: {},
      };

      healthCheckServiceValue.check.mockReturnValue(healthCheckResult);

      const result = await controller.check();

      expect(result).toEqual(healthCheckResult);
      expect(healthCheckServiceValue.check).toHaveBeenCalledTimes(1);
    });
  });
});

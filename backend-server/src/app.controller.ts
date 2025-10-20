import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Root')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Get API information' })
  @ApiResponse({
    status: 200,
    description: 'API information retrieved successfully',
  })
  getApiInfo() {
    return {
      message: 'Welcome to Cowors Backend API',
      version: '1.0.0',
      description: 'Cowors Backend API',
      endpoints: {
        health: '/api/health',
        user: '/api/user',
        file: '/api/file',
      },
      documentation: {
        swagger: '/api/docs',
      },
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }
}

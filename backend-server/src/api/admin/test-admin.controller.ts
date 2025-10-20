import { PublicAuth } from '@/decorators/auth/public-auth.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AdminService } from './admin.service';
import {
  AdminInvoiceListResponseDto,
  AdminInvoiceQueryDto,
} from './dto/admin-invoice.dto';

@ApiTags('Test Admin')
@Controller({ path: 'test-admin', version: '1' })
export class TestAdminController {
  constructor(private readonly adminService: AdminService) {
    console.log('🔧 TestAdminController constructor called');
    console.log('🔧 AdminService injected:', !!this.adminService);
  }

  @Get('simple')
  @PublicAuth()
  @SkipThrottle()
  @ApiOperation({ summary: 'Simple test endpoint' })
  async testSimple(): Promise<{ message: string }> {
    return { message: 'Test endpoint working' };
  }

  @Get('test-service')
  @PublicAuth()
  @SkipThrottle()
  @ApiOperation({ summary: 'Test admin service access' })
  async testService(): Promise<{ message: string; serviceAvailable: boolean }> {
    console.log('🔍 TestAdminController: testService called');
    try {
      // Test if we can access the service
      const serviceExists = !!this.adminService;
      console.log(
        '🔍 TestAdminController: adminService exists:',
        serviceExists,
      );

      // Try to call a simple method if it exists
      if (
        this.adminService &&
        typeof this.adminService.getPlatformStats === 'function'
      ) {
        console.log('🔍 TestAdminController: getPlatformStats method exists');
        return { message: 'Service accessible', serviceAvailable: true };
      } else {
        console.log(
          '🔍 TestAdminController: getPlatformStats method not found',
        );
        return {
          message: 'Service exists but method not found',
          serviceAvailable: false,
        };
      }
    } catch (error) {
      console.error('❌ TestAdminController: testService error:', error);
      return { message: 'Service error', serviceAvailable: false };
    }
  }

  @Get('invoices/partner')
  @PublicAuth()
  @SkipThrottle()
  @ApiOperation({ summary: 'Test get all partner invoices' })
  @ApiResponse({
    status: 200,
    description: 'Partner invoices retrieved successfully',
  })
  async testGetAllPartnerInvoices(@Query() queryDto: any): Promise<any> {
    console.log('🔍 TestAdminController: testGetAllPartnerInvoices called');
    console.log('🔍 TestAdminController: queryDto:', queryDto);

    try {
      console.log(
        '🔍 TestAdminController: About to call adminService.getAllPartnerInvoices',
      );
      const result = await this.adminService.getAllPartnerInvoices(queryDto);
      console.log('✅ TestAdminController: result obtained');
      return result;
    } catch (error) {
      console.error('❌ TestAdminController: error:', error);
      console.error('❌ TestAdminController: error stack:', error.stack);
      console.error('❌ TestAdminController: error message:', error.message);
      throw error;
    }
  }

  @Get('invoices/partner-simple')
  @PublicAuth()
  @SkipThrottle()
  @ApiOperation({
    summary: 'Test get all partner invoices without DTO validation',
  })
  async testGetAllPartnerInvoicesSimple(): Promise<any> {
    console.log(
      '🔍 TestAdminController: testGetAllPartnerInvoicesSimple called',
    );

    try {
      console.log(
        '🔍 TestAdminController: About to call adminService.getAllPartnerInvoices with empty object',
      );
      const result = await this.adminService.getAllPartnerInvoices({});
      console.log('✅ TestAdminController: result obtained');
      return result;
    } catch (error) {
      console.error('❌ TestAdminController: error:', error);
      console.error('❌ TestAdminController: error stack:', error.stack);
      console.error('❌ TestAdminController: error message:', error.message);
      throw error;
    }
  }

  @Get('platform-stats')
  @PublicAuth()
  @SkipThrottle()
  @ApiOperation({ summary: 'Test platform stats endpoint' })
  async testPlatformStats(): Promise<any> {
    console.log('🔍 TestAdminController: testPlatformStats called');

    try {
      console.log(
        '🔍 TestAdminController: About to call adminService.getPlatformStats',
      );
      const result = await this.adminService.getPlatformStats();
      console.log('✅ TestAdminController: getPlatformStats result obtained');
      return result;
    } catch (error) {
      console.error('❌ TestAdminController: getPlatformStats error:', error);
      console.error('❌ TestAdminController: error stack:', error.stack);
      console.error('❌ TestAdminController: error message:', error.message);
      throw error;
    }
  }
}

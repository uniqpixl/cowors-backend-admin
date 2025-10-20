import { Role } from '@/api/user/user.enum';
import { AuthGuard } from '@/auth/auth.guard';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminSpaceService } from './admin-space.service';

@ApiTags('Admin - Space Management')
@Controller({ path: 'admin/spaces', version: '1' })
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin, Role.SuperAdmin)
@ApiBearerAuth()
export class AdminSpaceController {
  constructor(private readonly adminSpaceService: AdminSpaceService) {}

  @Get('pending')
  @ApiOperation({ summary: 'Get pending spaces awaiting approval' })
  @ApiResponse({
    status: 200,
    description: 'Pending spaces retrieved successfully',
  })
  async getPendingSpaces(): Promise<any> {
    return this.adminSpaceService.getPendingSpaces();
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get detailed space statistics' })
  @ApiResponse({
    status: 200,
    description: 'Space statistics retrieved successfully',
  })
  async getSpaceStatistics(): Promise<any> {
    return this.adminSpaceService.getSpaceStatistics();
  }
}

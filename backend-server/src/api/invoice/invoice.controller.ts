import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ParseCoworsIdPipe } from '../../common/pipes/parse-cowors-id.pipe';
import { CurrentUserSession } from '../../decorators/auth/current-user-session.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { Role } from '../user/user.enum';
import {
  CreateInvoiceDto,
  GenerateInvoiceFromBookingDto,
  InvoiceListQueryDto,
  InvoiceResponseDto,
  InvoiceStatsDto,
  UpdateInvoiceDto,
} from './invoice.dto';
import { InvoiceService } from './invoice.service';

@ApiTags('Invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post('generate-from-booking')
  @ApiOperation({ summary: 'Generate invoice from booking' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Invoice generated successfully',
    type: InvoiceResponseDto,
  })
  @Roles(Role.Admin, Role.Partner, Role.User)
  async generateInvoiceFromBooking(
    @Body() dto: GenerateInvoiceFromBookingDto,
    @CurrentUserSession() user: any,
  ): Promise<InvoiceResponseDto> {
    return this.invoiceService.generateInvoiceFromBooking(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Invoice created successfully',
    type: InvoiceResponseDto,
  })
  @Roles(Role.Admin, Role.Partner)
  async createInvoice(
    @Body() dto: CreateInvoiceDto,
    @CurrentUserSession() user: any,
  ): Promise<InvoiceResponseDto> {
    // If partner, set partnerId to current user's partner ID
    if (user.role === Role.Partner) {
      dto.partnerId = user.partnerId;
    }

    return this.invoiceService.createInvoice(dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get invoice statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice statistics retrieved successfully',
    type: InvoiceStatsDto,
  })
  @Roles(Role.Admin, Role.Partner, Role.User)
  async getInvoiceStats(
    @CurrentUserSession() user: any,
    @Query('userId') userId?: string,
    @Query('partnerId') partnerId?: string,
  ): Promise<InvoiceStatsDto> {
    // Apply role-based filtering
    let filterUserId = userId;
    let filterPartnerId = partnerId;

    if (user.role === Role.User) {
      filterUserId = user.id; // Users can only see their own stats
      filterPartnerId = undefined;
    } else if (user.role === Role.Partner) {
      filterPartnerId = user.partnerId; // Partners can only see their own stats
    }
    // Admins can see all stats with provided filters

    return this.invoiceService.getInvoiceStats(filterUserId, filterPartnerId);
  }

  @Get()
  @ApiOperation({ summary: 'Get invoices with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoices retrieved successfully',
  })
  @Roles(Role.Admin, Role.Partner, Role.User)
  async getInvoices(
    @Query() query: InvoiceListQueryDto,
    @CurrentUserSession() user: any,
  ): Promise<{
    invoices: InvoiceResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Apply role-based filtering
    if (user.role === Role.User) {
      query.userId = user.id; // Users can only see their own invoices
      delete query.partnerId;
    } else if (user.role === Role.Partner) {
      query.partnerId = user.partnerId; // Partners can only see their own invoices
    }
    // Admins can see all invoices with provided filters

    return this.invoiceService.getInvoices(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice retrieved successfully',
    type: InvoiceResponseDto,
  })
  @Roles(Role.Admin, Role.Partner, Role.User)
  async getInvoiceById(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceService.getInvoiceById(id);

    // Check access permissions
    if (user.role === Role.User && invoice.userId !== user.id) {
      throw new Error('Access denied');
    }

    if (user.role === Role.Partner && invoice.partnerId !== user.partnerId) {
      throw new Error('Access denied');
    }

    return invoice;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update invoice' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice updated successfully',
    type: InvoiceResponseDto,
  })
  @Roles(Role.Admin, Role.Partner)
  async updateInvoice(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
    @CurrentUserSession() user: any,
  ): Promise<InvoiceResponseDto> {
    // Check access permissions for partners
    if (user.role === Role.Partner) {
      const invoice = await this.invoiceService.getInvoiceById(id);
      if (invoice.partnerId !== user.partnerId) {
        throw new Error('Access denied');
      }
    }

    return this.invoiceService.updateInvoice(id, dto);
  }

  @Put(':id/send')
  @ApiOperation({ summary: 'Send invoice to customer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice sent successfully',
    type: InvoiceResponseDto,
  })
  @Roles(Role.Admin, Role.Partner)
  async sendInvoice(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<InvoiceResponseDto> {
    // Check access permissions for partners
    if (user.role === Role.Partner) {
      const invoice = await this.invoiceService.getInvoiceById(id);
      if (invoice.partnerId !== user.partnerId) {
        throw new Error('Access denied');
      }
    }

    return this.invoiceService.updateInvoice(id, {
      status: 'sent' as any,
    });
  }

  @Put(':id/mark-paid')
  @ApiOperation({ summary: 'Mark invoice as paid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice marked as paid successfully',
    type: InvoiceResponseDto,
  })
  @Roles(Role.Admin, Role.Partner)
  async markInvoiceAsPaid(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<InvoiceResponseDto> {
    // Check access permissions for partners
    if (user.role === Role.Partner) {
      const invoice = await this.invoiceService.getInvoiceById(id);
      if (invoice.partnerId !== user.partnerId) {
        throw new Error('Access denied');
      }
    }

    return this.invoiceService.updateInvoice(id, {
      status: 'paid' as any,
    });
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel invoice' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice cancelled successfully',
    type: InvoiceResponseDto,
  })
  @Roles(Role.Admin, Role.Partner)
  async cancelInvoice(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUserSession() user: any,
  ): Promise<InvoiceResponseDto> {
    // Check access permissions for partners
    if (user.role === Role.Partner) {
      const invoice = await this.invoiceService.getInvoiceById(id);
      if (invoice.partnerId !== user.partnerId) {
        throw new Error('Access denied');
      }
    }

    return this.invoiceService.updateInvoice(id, {
      status: 'cancelled' as any,
      cancellationReason: reason,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete invoice' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Invoice deleted successfully',
  })
  @Roles(Role.Admin)
  async deleteInvoice(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<void> {
    return this.invoiceService.deleteInvoice(id);
  }
}

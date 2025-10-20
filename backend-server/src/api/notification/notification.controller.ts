import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import { NotificationEntity } from '../../database/entities/notification.entity';
import {
  BulkNotificationDto,
  CreateNotificationDto,
  NotificationQueryDto,
  NotificationResponseDto,
  UpdateNotificationStatusDto,
} from './dto/notification.dto';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto,
    @Request() req: any,
  ): Promise<NotificationResponseDto> {
    try {
      const notification = await this.notificationService.createNotification(
        createNotificationDto,
      );
      return this.mapToResponseDto(notification);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create notification',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Create multiple notifications' })
  @ApiResponse({
    status: 201,
    description: 'Bulk notifications created successfully',
    type: [NotificationResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createBulkNotifications(
    @Body() bulkNotificationDto: BulkNotificationDto,
    @Request() req: any,
  ): Promise<NotificationResponseDto[]> {
    try {
      const notifications =
        await this.notificationService.createBulkNotifications(
          bulkNotificationDto,
        );
      return notifications.map((notification) =>
        this.mapToResponseDto(notification),
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create bulk notifications',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['unread', 'read', 'delivered'],
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by notification type',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        notifications: {
          type: 'array',
          items: { $ref: '#/components/schemas/NotificationResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserNotifications(
    @Query() query: NotificationQueryDto,
    @Request() req: any,
  ): Promise<{
    notifications: NotificationResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const userId = req.user.sub;
      const result = await this.notificationService.getUserNotifications(
        userId,
        query,
      );

      return {
        notifications: result.notifications.map((notification) =>
          this.mapToResponseDto(notification),
        ),
        total: result.total,
        page: query.page || 1,
        limit: query.limit || 20,
        totalPages: Math.ceil(result.total / (query.limit || 20)),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve notifications',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(@Request() req: any): Promise<{ count: number }> {
    try {
      const userId = req.user.sub;
      const count = await this.notificationService.getUnreadCount(userId);
      return { count };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get unread count',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNotificationById(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<NotificationResponseDto> {
    try {
      const userId = req.user.sub;
      const notification = await this.notificationService.getNotificationById(
        id,
        userId,
      );

      if (!notification) {
        throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
      }

      return this.mapToResponseDto(notification);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to retrieve notification',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update notification status' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification status updated successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateNotificationStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateNotificationStatusDto,
    @Request() req: any,
  ): Promise<NotificationResponseDto> {
    try {
      const userId = req.user.sub;
      const notification =
        await this.notificationService.updateNotificationStatus(
          id,
          updateStatusDto,
        );

      if (!notification) {
        throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
      }

      return this.mapToResponseDto(notification);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to update notification status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAsRead(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<NotificationResponseDto> {
    try {
      const userId = req.user.sub;
      const notification = await this.notificationService.markAsRead(
        id,
        userId,
      );

      if (!notification) {
        throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
      }

      return this.mapToResponseDto(notification);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to mark notification as read',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        updatedCount: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllAsRead(
    @Request() req: any,
  ): Promise<{ message: string; updatedCount: number }> {
    try {
      const userId = req.user.sub;
      const updatedCount = await this.notificationService.markAllAsRead(userId);

      return {
        message: 'All notifications marked as read successfully',
        updatedCount,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to mark all notifications as read',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteNotification(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    try {
      const userId = req.user.sub;
      const deleted = await this.notificationService.deleteNotification(
        id,
        userId,
      );

      if (!deleted) {
        throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
      }

      return { message: 'Notification deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to delete notification',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('clear-all')
  @ApiOperation({ summary: 'Clear all notifications for user' })
  @ApiResponse({
    status: 200,
    description: 'All notifications cleared successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        deletedCount: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async clearAllNotifications(
    @Request() req: any,
  ): Promise<{ message: string; deletedCount: number }> {
    try {
      const userId = req.user.sub;
      const deletedCount =
        await this.notificationService.clearAllNotifications(userId);

      return {
        message: 'All notifications cleared successfully',
        deletedCount,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to clear all notifications',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Admin endpoints
  @Post('admin/send')
  @ApiOperation({ summary: 'Admin: Send notification to specific users' })
  @ApiResponse({
    status: 201,
    description: 'Admin notification sent successfully',
    type: [NotificationResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async sendAdminNotification(
    @Body() createNotificationDto: CreateNotificationDto,
    @Request() req: any,
  ): Promise<NotificationResponseDto[]> {
    try {
      // TODO: Add admin role check
      // if (!req.user.roles?.includes('admin')) {
      //   throw new HttpException('Admin access required', HttpStatus.FORBIDDEN);
      // }

      const notifications =
        await this.notificationService.sendAdminNotification(
          createNotificationDto,
        );

      return notifications.map((notification) =>
        this.mapToResponseDto(notification),
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to send admin notification',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('admin/broadcast')
  @ApiOperation({ summary: 'Admin: Broadcast notification to all users' })
  @ApiResponse({
    status: 201,
    description: 'Broadcast notification sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        sentCount: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async broadcastNotification(
    @Body() createNotificationDto: CreateNotificationDto,
    @Request() req: any,
  ): Promise<{ message: string; sentCount: number }> {
    try {
      // TODO: Add admin role check
      // if (!req.user.roles?.includes('admin')) {
      //   throw new HttpException('Admin access required', HttpStatus.FORBIDDEN);
      // }

      const sentCount = await this.notificationService.broadcastNotification(
        createNotificationDto,
      );

      return {
        message: 'Broadcast notification sent successfully',
        sentCount,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to broadcast notification',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Helper method to map entity to response DTO
  private mapToResponseDto(
    notification: NotificationEntity,
  ): NotificationResponseDto {
    return {
      id: notification.id,
      notificationId: notification.notificationId,
      userId: notification.userId,
      type: notification.type,
      category: notification.category,
      priority: notification.priority,
      title: notification.title,
      message: notification.message,
      status: notification.status,
      referenceId: notification.referenceId,
      referenceType: notification.referenceType,
      data: notification.data,
      channels: notification.channels,
      sentAt: notification.sentAt,
      deliveredAt: notification.deliveredAt,
      readAt: notification.readAt,
      scheduledAt: notification.scheduledAt,
      expiresAt: notification.expiresAt,
      failureReason: notification.failureReason,
      retryCount: notification.retryCount,
      maxRetries: notification.maxRetries,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}

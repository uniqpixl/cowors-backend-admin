import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { EventStatus } from '@/database/entities/event-store.entity';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import { EventReplayOptions, EventStoreService } from './event-store.service';

@ApiTags('Event Store')
@Controller('admin/event-store')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'system')
@ApiBearerAuth()
export class EventStoreController {
  constructor(private readonly eventStoreService: EventStoreService) {}

  @Get('statistics')
  @ApiOperation({ summary: 'Get event store statistics' })
  @ApiResponse({
    status: 200,
    description: 'Event store statistics retrieved successfully',
  })
  async getStatistics() {
    return this.eventStoreService.getStatistics();
  }

  @Get('events')
  @ApiOperation({ summary: 'Get events for replay or analysis' })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  @ApiQuery({ name: 'eventTypes', required: false, type: [String] })
  @ApiQuery({ name: 'aggregateIds', required: false, type: [String] })
  @ApiQuery({ name: 'aggregateTypes', required: false, type: [String] })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: EventStatus,
    isArray: true,
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Events retrieved successfully',
  })
  async getEvents(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('eventTypes') eventTypes?: string | string[],
    @Query('aggregateIds') aggregateIds?: string | string[],
    @Query('aggregateTypes') aggregateTypes?: string | string[],
    @Query('status') status?: EventStatus | EventStatus[],
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const options: EventReplayOptions = {
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      eventTypes: Array.isArray(eventTypes)
        ? eventTypes
        : eventTypes
          ? [eventTypes]
          : undefined,
      aggregateIds: Array.isArray(aggregateIds)
        ? aggregateIds
        : aggregateIds
          ? [aggregateIds]
          : undefined,
      aggregateTypes: Array.isArray(aggregateTypes)
        ? aggregateTypes
        : aggregateTypes
          ? [aggregateTypes]
          : undefined,
      status: Array.isArray(status) ? status : status ? [status] : undefined,
      limit: limit ? parseInt(limit.toString()) : undefined,
      offset: offset ? parseInt(offset.toString()) : undefined,
    };

    return this.eventStoreService.getEventsForReplay(options);
  }

  @Get('stream')
  @ApiOperation({ summary: 'Get event stream for a specific aggregate' })
  @ApiQuery({ name: 'aggregateId', required: false, type: String })
  @ApiQuery({ name: 'aggregateType', required: false, type: String })
  @ApiQuery({ name: 'fromVersion', required: false, type: Number })
  @ApiQuery({ name: 'toVersion', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Event stream retrieved successfully',
  })
  async getEventStream(
    @Query('aggregateId') aggregateId?: string,
    @Query('aggregateType') aggregateType?: string,
    @Query('fromVersion') fromVersion?: number,
    @Query('toVersion') toVersion?: number,
  ) {
    return this.eventStoreService.getEventStream({
      aggregateId,
      aggregateType,
      fromVersion,
      toVersion,
    });
  }

  @Post('replay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Replay events based on criteria' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fromDate: { type: 'string', format: 'date-time' },
        toDate: { type: 'string', format: 'date-time' },
        eventTypes: { type: 'array', items: { type: 'string' } },
        aggregateIds: { type: 'array', items: { type: 'string' } },
        aggregateTypes: { type: 'array', items: { type: 'string' } },
        status: { type: 'array', items: { enum: Object.values(EventStatus) } },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Events replayed successfully',
    schema: {
      type: 'object',
      properties: {
        replayedCount: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  async replayEvents(@Body() options: EventReplayOptions) {
    // Convert string dates to Date objects
    if (options.fromDate && typeof options.fromDate === 'string') {
      options.fromDate = new Date(options.fromDate);
    }
    if (options.toDate && typeof options.toDate === 'string') {
      options.toDate = new Date(options.toDate);
    }

    const replayedCount = await this.eventStoreService.replayEvents(options);

    return {
      replayedCount,
      message: `Successfully replayed ${replayedCount} events`,
    };
  }

  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clean up old processed events' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        retentionDays: { type: 'number', default: 90 },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Old events cleaned up successfully',
    schema: {
      type: 'object',
      properties: {
        deletedCount: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  async cleanupOldEvents(@Body() body: { retentionDays?: number }) {
    const retentionDays = body.retentionDays || 90;
    const deletedCount =
      await this.eventStoreService.cleanupOldEvents(retentionDays);

    return {
      deletedCount,
      message: `Successfully deleted ${deletedCount} old events (older than ${retentionDays} days)`,
    };
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthGuard } from '@/auth/auth.guard';
import { UserEntity } from '@/auth/entities/user.entity';
import { MessageSenderType } from '@/database/entities/message.entity';
import { CurrentUserSession } from '@/decorators/auth/current-user-session.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ConversationDto } from './dto/conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageDto } from './dto/message.dto';
import { GetConversationMessagesDto } from './dto/query-messages.dto';
import { MessageService } from './message.service';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(AuthGuard)
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  async createMessage(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUserSession('user') userSession: CurrentUserSession['user'],
  ): Promise<MessageDto> {
    // Get full user entity to access role
    const user = await this.userRepository.findOne({
      where: { id: userSession.id },
    });

    const senderType =
      user.role === 'Partner'
        ? MessageSenderType.PARTNER
        : MessageSenderType.USER;

    return this.messageService.createMessage(
      createMessageDto,
      userSession.id,
      senderType,
    );
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get user conversations' })
  async getConversations(
    @CurrentUserSession('user') userSession: CurrentUserSession['user'],
  ): Promise<ConversationDto[]> {
    return this.messageService.getConversations(userSession.id);
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get messages in a conversation' })
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @Query() query: GetConversationMessagesDto,
    @CurrentUserSession('user') userSession: CurrentUserSession['user'],
  ): Promise<{ messages: MessageDto[]; total: number }> {
    return this.messageService.getConversationMessages(
      conversationId,
      userSession.id,
      query,
    );
  }

  @Patch(':messageId/read')
  @ApiOperation({ summary: 'Mark message as read' })
  async markMessageAsRead(
    @Param('messageId') messageId: string,
    @CurrentUserSession('user') userSession: CurrentUserSession['user'],
  ): Promise<MessageDto> {
    return this.messageService.markMessageAsRead(messageId, userSession.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread message count' })
  async getUnreadCount(
    @CurrentUserSession('user') userSession: CurrentUserSession['user'],
  ): Promise<{ count: number }> {
    const count = await this.messageService.getTotalUnreadCount(userSession.id);
    return { count };
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation' })
  async createConversation(
    @Body() body: { bookingId: string; partnerId: string },
    @CurrentUserSession('user') userSession: CurrentUserSession['user'],
  ): Promise<ConversationDto> {
    return this.messageService.createConversation(
      body.bookingId,
      userSession.id,
      body.partnerId,
    );
  }
}

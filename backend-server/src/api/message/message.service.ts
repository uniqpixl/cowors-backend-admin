import {
  ErrorCodes,
  ErrorResponseUtil,
} from '@/common/utils/error-response.util';
import { ConversationEntity, MessageEntity } from '@/database/entities';
import {
  MessageSenderType,
  MessageStatus,
  MessageType,
} from '@/database/entities/message.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ConversationDto } from './dto/conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageDto } from './dto/message.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
  ) {}

  async createMessage(
    createMessageDto: CreateMessageDto,
    senderId: string,
    senderType: MessageSenderType,
  ): Promise<MessageDto> {
    // Verify conversation exists and user has access
    const conversation = await this.conversationRepository.findOne({
      where: { id: createMessageDto.conversationId },
      relations: ['user', 'partner'],
    });

    if (!conversation) {
      throw ErrorResponseUtil.notFound(
        'Conversation',
        createMessageDto.conversationId,
      );
    }

    // Check if user has access to this conversation
    const hasAccess =
      conversation.userId === senderId || conversation.partnerId === senderId;
    if (!hasAccess) {
      throw ErrorResponseUtil.forbidden(
        'Access denied to this conversation',
        ErrorCodes.FORBIDDEN,
      );
    }

    // Create message
    const message = this.messageRepository.create({
      ...createMessageDto,
      senderId,
      senderType,
      messageType: createMessageDto.messageType || MessageType.TEXT,
      status: MessageStatus.SENT,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation last activity
    await this.conversationRepository.update(conversation.id, {
      lastActivity: new Date(),
    });

    return savedMessage.toDto(MessageDto);
  }

  async getConversations(userId: string): Promise<ConversationDto[]> {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.booking', 'booking')
      .leftJoinAndSelect('conversation.user', 'user')
      .leftJoinAndSelect('conversation.partner', 'partner')
      .leftJoin(
        'messages',
        'lastMessage',
        'lastMessage.conversationId = conversation.id AND lastMessage.createdAt = (SELECT MAX(createdAt) FROM messages WHERE conversationId = conversation.id)',
      )
      .addSelect([
        'lastMessage.id',
        'lastMessage.content',
        'lastMessage.senderType',
        'lastMessage.messageType',
        'lastMessage.status',
        'lastMessage.createdAt',
      ])
      .where(
        'conversation.userId = :userId OR conversation.partnerId = :userId',
        {
          userId,
        },
      )
      .orderBy('conversation.lastActivity', 'DESC')
      .getMany();

    // Get unread counts for each conversation
    const conversationDtos = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await this.getUnreadCount(conversation.id, userId);
        const dto = conversation.toDto(ConversationDto);
        dto.unreadCount = unreadCount;
        return dto;
      }),
    );

    return conversationDtos;
  }

  async getConversationMessages(
    conversationId: string,
    userId: string,
    query: QueryMessagesDto,
  ): Promise<{ messages: MessageDto[]; total: number }> {
    // Verify user has access to conversation
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw ErrorResponseUtil.notFound('Conversation', conversationId);
    }

    const hasAccess =
      conversation.userId === userId || conversation.partnerId === userId;
    if (!hasAccess) {
      throw ErrorResponseUtil.forbidden(
        'Access denied to this conversation',
        ErrorCodes.FORBIDDEN,
      );
    }

    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
      relations: ['sender'],
    });

    const messageDtos = messages.map((message) => message.toDto(MessageDto));

    return { messages: messageDtos, total };
  }

  async markMessageAsRead(
    messageId: string,
    userId: string,
  ): Promise<MessageDto> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['conversation'],
    });

    if (!message) {
      throw ErrorResponseUtil.notFound('Message', messageId);
    }

    // Verify user has access and is not the sender
    const conversation = await this.conversationRepository.findOne({
      where: { id: message.conversationId },
    });

    const hasAccess =
      conversation.userId === userId || conversation.partnerId === userId;
    if (!hasAccess || message.senderId === userId) {
      throw ErrorResponseUtil.forbidden(
        'Cannot mark own message as read',
        ErrorCodes.FORBIDDEN,
      );
    }

    // Update message status
    await this.messageRepository.update(messageId, {
      status: MessageStatus.READ,
      readAt: new Date(),
    });

    const updatedMessage = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    return updatedMessage.toDto(MessageDto);
  }

  async getUnreadCount(
    conversationId: string,
    userId: string,
  ): Promise<number> {
    return this.messageRepository.count({
      where: {
        conversationId,
        senderId: userId,
        status: MessageStatus.SENT,
      },
    });
  }

  async getTotalUnreadCount(userId: string): Promise<number> {
    const conversations = await this.conversationRepository.find({
      where: [{ userId }, { partnerId: userId }],
    });

    let totalUnread = 0;
    for (const conversation of conversations) {
      const unread = await this.getUnreadCount(conversation.id, userId);
      totalUnread += unread;
    }

    return totalUnread;
  }

  async createConversation(
    bookingId: string,
    userId: string,
    partnerId: string,
  ): Promise<ConversationDto> {
    // Check if conversation already exists
    const existingConversation = await this.conversationRepository.findOne({
      where: { bookingId },
    });

    if (existingConversation) {
      return existingConversation.toDto(ConversationDto);
    }

    // Create new conversation
    const conversation = this.conversationRepository.create({
      bookingId,
      userId,
      partnerId,
      lastActivity: new Date(),
    });

    const savedConversation =
      await this.conversationRepository.save(conversation);

    return savedConversation.toDto(ConversationDto);
  }
}

import {
  MessageActionType,
  MessageSenderType,
  MessageStatus,
  MessageType,
} from '@/database/entities/message.entity';
import { Expose, Type } from 'class-transformer';

export class MessageDto {
  @Expose()
  id: string;

  @Expose()
  conversationId: string;

  @Expose()
  senderId: string;

  @Expose()
  senderType: MessageSenderType;

  @Expose()
  content: string;

  @Expose()
  messageType: MessageType;

  @Expose()
  status: MessageStatus;

  @Expose()
  actionType?: MessageActionType;

  @Expose()
  @Type(() => Date)
  readAt?: Date;

  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @Type(() => Date)
  updatedAt: Date;
}

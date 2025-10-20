import { Expose, Type } from 'class-transformer';
import { MessageDto } from './message.dto';

export class ConversationDto {
  @Expose()
  id: string;

  @Expose()
  bookingId: string;

  @Expose()
  userId: string;

  @Expose()
  partnerId: string;

  @Expose()
  isActive: boolean;

  @Expose()
  @Type(() => Date)
  lastActivity?: Date;

  @Expose()
  @Type(() => MessageDto)
  lastMessage?: MessageDto;

  @Expose()
  unreadCount?: number;

  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @Type(() => Date)
  updatedAt: Date;
}

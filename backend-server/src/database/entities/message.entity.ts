import { UserEntity } from '@/auth/entities/user.entity';
import { BaseModel } from '@/database/models/base.model';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityType } from '../../utils/id-generator.service';
import { ConversationEntity } from './conversation.entity';

export enum MessageSenderType {
  USER = 'user',
  PARTNER = 'partner',
  SYSTEM = 'system',
}

export enum MessageType {
  TEXT = 'text',
  SYSTEM_ACTION = 'system_action',
  BOOKING_UPDATE = 'booking_update',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

export enum MessageActionType {
  EXTEND_TIME = 'extend_time',
  MODIFY_BOOKING = 'modify_booking',
  CANCEL_BOOKING = 'cancel_booking',
}

@Entity('messages')
export class MessageEntity extends BaseModel {
  @Index()
  @Column({ type: 'uuid', name: 'conversation_id' })
  conversationId: string;

  @Index()
  @Column({ type: 'uuid', name: 'sender_id' })
  senderId: string;

  @Column({
    type: 'enum',
    enum: MessageSenderType,
    name: 'sender_type',
  })
  senderType: MessageSenderType;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
    name: 'message_type',
  })
  messageType: MessageType;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  status: MessageStatus;

  @Column({
    type: 'enum',
    enum: MessageActionType,
    nullable: true,
    name: 'action_type',
  })
  actionType?: MessageActionType;

  @Column({ type: 'timestamp', nullable: true, name: 'read_at' })
  readAt?: Date;

  // Relations
  @ManyToOne(() => ConversationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: ConversationEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender: UserEntity;

  protected getEntityType(): EntityType {
    return EntityType.USER;
  }
}

import {
  MessageActionType,
  MessageSenderType,
  MessageType,
} from '@/database/entities/message.entity';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(MessageSenderType)
  @IsOptional()
  senderType?: MessageSenderType;

  @IsEnum(MessageType)
  @IsOptional()
  messageType?: MessageType;

  @IsEnum(MessageActionType)
  @IsOptional()
  actionType?: MessageActionType;
}

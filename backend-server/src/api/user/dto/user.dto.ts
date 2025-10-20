import { CursorPaginationDto } from '@/common/dto/cursor-pagination/cursor-pagination.dto';
import { PageOptionsDto as CursorPageOptions } from '@/common/dto/cursor-pagination/page-options.dto';
import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { PageOptionsDto as OffsetPageOptions } from '@/common/dto/offset-pagination/page-options.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import {
  ClassField,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { Role } from '../user.enum';

@Exclude()
export class UserDto {
  @StringField()
  @Expose()
  id: string;

  @ApiProperty({ enum: Role })
  @Expose()
  role: Role;

  @StringField()
  @Expose()
  username: string;

  @StringField()
  @Expose()
  email: string;

  @StringFieldOptional()
  @Expose()
  firstName?: string;

  @StringFieldOptional()
  @Expose()
  lastName?: string;

  @StringFieldOptional()
  @Expose()
  image?: string;

  @ClassField(() => Date)
  @Expose()
  createdAt: Date;

  @ClassField(() => Date)
  @Expose()
  updatedAt: Date;

  @Expose()
  @StringFieldOptional()
  bio?: string;
}

export class QueryUsersOffsetDto extends OffsetPageOptions {}

export class OffsetPaginatedUserDto extends OffsetPaginatedDto<UserDto> {
  declare data: UserDto[];
}

export class QueryUsersCursorDto extends CursorPageOptions {}

export class CursorPaginatedUserDto extends CursorPaginatedDto<UserDto> {
  declare data: UserDto[];
}

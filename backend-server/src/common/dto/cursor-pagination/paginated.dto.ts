import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { CursorPaginationDto } from './cursor-pagination.dto';

export class CursorPaginatedDto<TData> {
  @ApiProperty({ type: 'array', description: 'Array of data items' })
  @Expose()
  data: TData[];

  @ApiProperty({ type: CursorPaginationDto })
  @Expose()
  pagination: CursorPaginationDto;

  constructor(data: TData[], meta: CursorPaginationDto) {
    this.data = data;
    this.pagination = meta;
  }
}

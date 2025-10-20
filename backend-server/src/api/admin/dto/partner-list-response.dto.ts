import { PartnerStatus, VerificationStatus } from '@/common/enums/partner.enum';
import { ApiProperty } from '@nestjs/swagger';

// Partner list item DTO
export class PartnerListItemDto {
  @ApiProperty({ description: 'Partner ID' })
  id: string;

  @ApiProperty({ description: 'Partner name' })
  name: string;

  @ApiProperty({ description: 'Partner email' })
  email: string;

  @ApiProperty({ description: 'Company name' })
  companyName: string;

  @ApiProperty({ description: 'Phone number' })
  phone: string;

  @ApiProperty({ enum: PartnerStatus, description: 'Partner status' })
  status: PartnerStatus;

  @ApiProperty({ enum: VerificationStatus, description: 'Verification status' })
  verificationStatus: VerificationStatus;

  @ApiProperty({ description: 'City' })
  city: string;

  @ApiProperty({ description: 'Area' })
  area: string;

  @ApiProperty({ description: 'Number of spaces' })
  spacesCount: number;

  @ApiProperty({ description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ description: 'Registration date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last active date' })
  lastActive: Date;
}

// Partner list response DTO
export class PartnerListResponseDto {
  @ApiProperty({ type: [PartnerListItemDto], description: 'List of partners' })
  data: PartnerListItemDto[];

  @ApiProperty({ description: 'Total number of partners' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPreviousPage: boolean;
}

import { PartnerStatus, VerificationStatus } from '@/common/enums/partner.enum';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerEntity } from '../../database/entities/partner.entity';
import { AdminPartnerQueryDto } from './dto/admin-partner-query.dto';
import { PartnerListResponseDto } from './dto/partner-list-response.dto';

@Injectable()
export class AdminPartnerSimpleService {
  constructor(
    @InjectRepository(PartnerEntity)
    private readonly partnerRepository: Repository<PartnerEntity>,
  ) {}

  async findAllPartners(
    query: AdminPartnerQueryDto,
  ): Promise<PartnerListResponseDto> {
    console.log(
      '🔍 AdminPartnerSimpleService.findAllPartners called with query:',
      JSON.stringify(query, null, 2),
    );

    try {
      console.log('🏗️ Building simple query...');

      // Start with the simplest possible query
      const queryBuilder = this.partnerRepository
        .createQueryBuilder('partner')
        .leftJoinAndSelect('partner.user', 'user');

      console.log('✅ Basic query builder created');

      // Apply minimal pagination
      const page = query?.page || 1;
      const limit = query?.limit || 10;
      const skip = (page - 1) * limit;

      queryBuilder.skip(skip).take(limit);
      console.log(`📊 Applied pagination: skip=${skip}, take=${limit}`);

      console.log('🔍 Executing query...');
      const [partners, total] = await queryBuilder.getManyAndCount();
      console.log(
        `📊 Query successful: found ${partners.length} partners out of ${total} total`,
      );

      // Transform to simple response format
      const transformedData = partners.map((partner) => {
        console.log(`🔄 Processing partner ${partner.id}`);

        return {
          id: partner.id,
          name: partner.businessName || 'N/A',
          email: partner.user?.email || 'N/A',
          companyName: partner.businessName || 'N/A',
          phone: 'N/A', // Simplified for now
          status: (partner.status as PartnerStatus) || PartnerStatus.DRAFT,
          verificationStatus:
            (partner.verificationStatus as VerificationStatus) ||
            VerificationStatus.PENDING,
          city: 'N/A', // Simplified for now
          area: 'N/A', // Simplified for now
          spacesCount: 0, // Simplified for now
          totalRevenue: 0, // Simplified for now
          createdAt: partner.createdAt,
          lastActive: partner.updatedAt,
        };
      });

      console.log(`🔄 Transformed ${transformedData.length} partners`);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      const result = {
        data: transformedData,
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };

      console.log('✅ Returning result:', {
        dataCount: result.data.length,
        total: result.total,
        page: result.page,
        limit: result.limit,
      });

      return result;
    } catch (error) {
      console.error(
        '💥 Error in AdminPartnerSimpleService.findAllPartners:',
        error.message,
      );
      console.error('📍 Stack trace:', error.stack);

      // Return empty result instead of throwing
      return {
        data: [],
        total: 0,
        page: query?.page || 1,
        limit: query?.limit || 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }
  }
}

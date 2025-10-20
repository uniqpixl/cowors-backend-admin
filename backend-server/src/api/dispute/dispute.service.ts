import { Role } from '@/api/user/user.enum';
import { UserEntity } from '@/auth/entities/user.entity';
import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { ErrorResponseUtil } from '@/common/utils/error-response.util';
import { BookingEntity } from '@/database/entities/booking.entity';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Like, Repository } from 'typeorm';
import {
  CreateDisputeDto,
  DisputeDto,
  DisputeQueryDto,
  DisputeStatsDto,
  EscalateDisputeDto,
  ResolveDisputeDto,
  TimelineEventDto,
  UpdateDisputeDto,
} from './dto/dispute.dto';
import {
  DisputeEntity,
  DisputePriority,
  DisputeResolution,
  DisputeStatus,
  DisputeType,
} from './entities/dispute.entity';

@Injectable()
export class DisputeService {
  constructor(
    @InjectRepository(DisputeEntity)
    private readonly disputeRepository: Repository<DisputeEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
  ) {}

  async create(createDisputeDto: CreateDisputeDto): Promise<DisputeDto> {
    // Validate users exist
    const complainant = await this.userRepository.findOne({
      where: { id: createDisputeDto.complainantId },
    });
    if (!complainant) {
      throw new NotFoundException('Complainant not found');
    }

    const respondent = await this.userRepository.findOne({
      where: { id: createDisputeDto.respondentId },
    });
    if (!respondent) {
      throw new NotFoundException('Respondent not found');
    }

    // Validate booking if provided
    if (createDisputeDto.bookingId) {
      const booking = await this.bookingRepository.findOne({
        where: { id: createDisputeDto.bookingId },
        relations: ['spaceOption', 'spaceOption.space'],
      });
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      // Check if complainant is involved in the booking
      if (
        booking.userId !== createDisputeDto.complainantId &&
        booking.spaceOption?.space?.listing?.partner_id !==
          createDisputeDto.complainantId
      ) {
        throw new ForbiddenException(
          'You can only dispute bookings you are involved in',
        );
      }
    }

    // Check for existing active disputes between the same parties
    const existingDispute = await this.disputeRepository.findOne({
      where: {
        complainantId: createDisputeDto.complainantId,
        respondentId: createDisputeDto.respondentId,
        bookingId: createDisputeDto.bookingId,
        status: DisputeStatus.PENDING,
      },
    });

    if (existingDispute) {
      throw new ConflictException(
        'An active dispute already exists between these parties for this booking',
      );
    }

    // Create initial timeline event
    const initialTimeline: TimelineEventDto[] = [
      {
        event: 'Dispute created',
        timestamp: new Date(),
        actor: complainant.firstName + ' ' + complainant.lastName,
        details: `Dispute of type ${createDisputeDto.type} was filed`,
      },
    ];

    const dispute = this.disputeRepository.create({
      ...createDisputeDto,
      status: DisputeStatus.PENDING,
      priority: createDisputeDto.priority || DisputePriority.MEDIUM,
      timeline: initialTimeline,
      isEscalated: false,
      requiresLegalAction: false,
    });

    const savedDispute = await this.disputeRepository.save(dispute);
    return new DisputeDto(savedDispute);
  }

  async findAll(
    query: DisputeQueryDto,
  ): Promise<OffsetPaginatedDto<DisputeDto>> {
    const {
      page = 1,
      limit = 10,
      search,
      createdFrom,
      createdTo,
      ...filters
    } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<DisputeEntity> = {};

    // Apply filters
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.complainantId) where.complainantId = filters.complainantId;
    if (filters.respondentId) where.respondentId = filters.respondentId;
    if (filters.bookingId) where.bookingId = filters.bookingId;
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters.isEscalated !== undefined)
      where.isEscalated = filters.isEscalated;

    // Date range filter
    if (createdFrom || createdTo) {
      where.createdAt = Between(
        createdFrom ? new Date(createdFrom) : new Date('1970-01-01'),
        createdTo ? new Date(createdTo) : new Date(),
      );
    }

    const queryBuilder = this.disputeRepository.createQueryBuilder('dispute');

    // Apply where conditions
    Object.entries(where).forEach(([key, value]) => {
      if (key === 'createdAt' && value) {
        queryBuilder.andWhere('dispute.createdAt BETWEEN :from AND :to', {
          from: (value as any).from,
          to: (value as any).to,
        });
      } else {
        queryBuilder.andWhere(`dispute.${key} = :${key}`, { [key]: value });
      }
    });

    // Search in title and description
    if (search) {
      queryBuilder.andWhere(
        '(dispute.title ILIKE :search OR dispute.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination and get results
    const disputes = await queryBuilder
      .orderBy('dispute.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const items = disputes.map((dispute) => new DisputeDto(dispute));

    const pageOptions = new PageOptionsDto();
    Object.assign(pageOptions, { page, limit });
    const pagination = new OffsetPaginationDto(total, pageOptions);

    return new OffsetPaginatedDto(items, pagination);
  }

  async findOne(id: string): Promise<DisputeDto> {
    const dispute = await this.disputeRepository.findOne({
      where: { id },
      relations: ['complainant', 'respondent', 'booking'],
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    return new DisputeDto(dispute);
  }

  async update(
    id: string,
    updateDisputeDto: UpdateDisputeDto,
    userId: string,
  ): Promise<DisputeDto> {
    const dispute = await this.disputeRepository.findOne({ where: { id } });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    // Check if user has permission to update
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only admins, assigned moderators, or involved parties can update
    const canUpdate =
      user.role === Role.Admin ||
      dispute.assignedTo === userId ||
      dispute.complainantId === userId ||
      dispute.respondentId === userId;

    if (!canUpdate) {
      throw new ForbiddenException(
        'You do not have permission to update this dispute',
      );
    }

    // Add timeline event for significant changes
    const timeline = dispute.timeline || [];
    const userName = user.firstName + ' ' + user.lastName;

    if (updateDisputeDto.status && updateDisputeDto.status !== dispute.status) {
      timeline.push({
        event: `Status changed to ${updateDisputeDto.status}`,
        timestamp: new Date(),
        actor: userName,
        details: `Status updated from ${dispute.status} to ${updateDisputeDto.status}`,
      });
    }

    if (
      updateDisputeDto.assignedTo &&
      updateDisputeDto.assignedTo !== dispute.assignedTo
    ) {
      timeline.push({
        event: 'Dispute assigned',
        timestamp: new Date(),
        actor: userName,
        details: `Dispute assigned to new moderator`,
      });
    }

    // Merge timeline events
    if (updateDisputeDto.timeline) {
      timeline.push(...updateDisputeDto.timeline);
    }

    Object.assign(dispute, updateDisputeDto, { timeline });
    const updatedDispute = await this.disputeRepository.save(dispute);
    return new DisputeDto(updatedDispute);
  }

  async escalate(
    id: string,
    escalateDto: EscalateDisputeDto,
    userId: string,
  ): Promise<DisputeDto> {
    const dispute = await this.disputeRepository.findOne({ where: { id } });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.isEscalated) {
      throw new ConflictException('Dispute is already escalated');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate assignTo user if provided
    if (escalateDto.assignTo) {
      const assignee = await this.userRepository.findOne({
        where: { id: escalateDto.assignTo },
      });
      if (!assignee || assignee.role !== Role.Admin) {
        throw new BadRequestException(
          'Can only assign escalated disputes to admin users',
        );
      }
    }

    const timeline = dispute.timeline || [];
    timeline.push({
      event: 'Dispute escalated',
      timestamp: new Date(),
      actor: user.firstName + ' ' + user.lastName,
      details: escalateDto.reason,
    });

    Object.assign(dispute, {
      isEscalated: true,
      escalatedAt: new Date(),
      status: DisputeStatus.ESCALATED,
      priority: escalateDto.newPriority || DisputePriority.HIGH,
      assignedTo: escalateDto.assignTo || dispute.assignedTo,
      timeline,
    });

    const updatedDispute = await this.disputeRepository.save(dispute);
    return new DisputeDto(updatedDispute);
  }

  async resolve(
    id: string,
    resolveDto: ResolveDisputeDto,
    userId: string,
  ): Promise<DisputeDto> {
    const dispute = await this.disputeRepository.findOne({ where: { id } });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status === DisputeStatus.RESOLVED) {
      throw new ConflictException('Dispute is already resolved');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only admins or assigned moderators can resolve disputes
    if (user.role !== Role.Admin && dispute.assignedTo !== userId) {
      throw new ForbiddenException(
        'You do not have permission to resolve this dispute',
      );
    }

    const timeline = dispute.timeline || [];
    timeline.push({
      event: 'Dispute resolved',
      timestamp: new Date(),
      actor: user.firstName + ' ' + user.lastName,
      details: `Resolved with ${resolveDto.resolution}: ${resolveDto.resolutionNotes}`,
    });

    Object.assign(dispute, {
      status: DisputeStatus.RESOLVED,
      resolution: resolveDto.resolution,
      resolutionNotes: resolveDto.resolutionNotes,
      resolvedAmount: resolveDto.resolvedAmount,
      resolvedBy: userId,
      resolvedAt: new Date(),
      timeline,
    });

    const updatedDispute = await this.disputeRepository.save(dispute);
    return new DisputeDto(updatedDispute);
  }

  async remove(id: string, userId: string): Promise<void> {
    const dispute = await this.disputeRepository.findOne({ where: { id } });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || user.role !== Role.Admin) {
      throw new ForbiddenException('Only admins can delete disputes');
    }

    await this.disputeRepository.remove(dispute);
  }

  async getStats(): Promise<DisputeStatsDto> {
    const total = await this.disputeRepository.count();
    const pending = await this.disputeRepository.count({
      where: { status: DisputeStatus.PENDING },
    });
    const underReview = await this.disputeRepository.count({
      where: { status: DisputeStatus.UNDER_REVIEW },
    });
    const escalated = await this.disputeRepository.count({
      where: { isEscalated: true },
    });
    const resolved = await this.disputeRepository.count({
      where: { status: DisputeStatus.RESOLVED },
    });

    // Calculate average resolution time
    const resolvedDisputes = await this.disputeRepository.find({
      where: { status: DisputeStatus.RESOLVED },
      select: ['createdAt', 'resolvedAt'],
    });

    let avgResolutionTime = 0;
    if (resolvedDisputes.length > 0) {
      const totalResolutionTime = resolvedDisputes.reduce((sum, dispute) => {
        if (dispute.resolvedAt) {
          return (
            sum + (dispute.resolvedAt.getTime() - dispute.createdAt.getTime())
          );
        }
        return sum;
      }, 0);
      avgResolutionTime =
        totalResolutionTime / resolvedDisputes.length / (1000 * 60 * 60); // Convert to hours
    }

    // Get disputes by type
    const byType: Record<DisputeType, number> = {} as Record<
      DisputeType,
      number
    >;
    for (const type of Object.values(DisputeType)) {
      byType[type] = await this.disputeRepository.count({ where: { type } });
    }

    // Get disputes by priority
    const byPriority: Record<DisputePriority, number> = {} as Record<
      DisputePriority,
      number
    >;
    for (const priority of Object.values(DisputePriority)) {
      byPriority[priority] = await this.disputeRepository.count({
        where: { priority },
      });
    }

    return {
      total,
      pending,
      underReview,
      escalated,
      resolved,
      avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
      byType,
      byPriority,
    };
  }

  async getUserDisputes(
    userId: string,
    query: DisputeQueryDto,
  ): Promise<OffsetPaginatedDto<DisputeDto>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.disputeRepository
      .createQueryBuilder('dispute')
      .where(
        'dispute.complainantId = :userId OR dispute.respondentId = :userId',
        { userId },
      )
      .orderBy('dispute.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Apply additional filters
    if (query.status) {
      queryBuilder.andWhere('dispute.status = :status', {
        status: query.status,
      });
    }
    if (query.type) {
      queryBuilder.andWhere('dispute.type = :type', { type: query.type });
    }

    const [disputes, total] = await queryBuilder.getManyAndCount();
    const items = disputes.map((dispute) => new DisputeDto(dispute));

    const pageOptions = new PageOptionsDto();
    Object.assign(pageOptions, { page, limit });
    const pagination = new OffsetPaginationDto(total, pageOptions);

    return new OffsetPaginatedDto(items, pagination);
  }
}

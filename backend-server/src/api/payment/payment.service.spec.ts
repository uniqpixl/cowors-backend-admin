import {
  BookingStatus,
  PaymentGateway,
  PaymentStatus,
  RefundStatus,
} from '@/common/enums/booking.enum';
import { PaymentMethod } from '@/common/enums/payment.enum';
import { BookingEntity } from '@/database/entities/booking.entity';
import { PaymentEntity } from '@/database/entities/payment.entity';
import { RefundEntity, RefundMethod } from '@/database/entities/refund.entity';
import { WalletBalanceEntity } from '@/database/entities/wallet-balance.entity';
import { WalletTransactionEntity } from '@/database/entities/wallet-transaction.entity';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { WalletService } from '../wallet/wallet.service';
import {
  CreatePaymentDto,
  CreateRefundDto,
  ProcessPaymentDto,
} from './dto/payment.dto';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRepository: Repository<PaymentEntity>;
  let refundRepository: Repository<RefundEntity>;
  let bookingRepository: Repository<BookingEntity>;
  let walletBalanceRepository: Repository<WalletBalanceEntity>;
  let walletTransactionRepository: Repository<WalletTransactionEntity>;
  let walletService: WalletService;
  let configService: ConfigService;
  let dataSource: DataSource;

  const mockBooking: Partial<BookingEntity> = {
    id: 'booking-1',
    userId: 'user-1',
    spaceId: 'space-1',
    bookingNumber: 'BK001',
    startDateTime: new Date(),
    endDateTime: new Date(),
    duration: 120,
    guestCount: 1,
    baseAmount: 100,
    extrasAmount: 0,
    discountAmount: 10,
    couponCode: 'TEST10',
    couponId: 'coupon-1',
    taxAmount: 0,
    totalAmount: 90,
    currency: 'INR',
    status: BookingStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPayment: Partial<PaymentEntity> = {
    id: 'payment-1',
    userId: 'user-1',
    bookingId: 'booking-1',
    paymentId: 'PAY001',
    gatewayPaymentId: 'gw_pay_001',
    gatewayOrderId: 'gw_order_001',
    gateway: PaymentGateway.STRIPE,
    method: PaymentMethod.CREDIT_CARD,
    amount: 90,
    currency: 'INR',
    status: PaymentStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPaymentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockRefundRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockWalletBalanceRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockWalletTransactionRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockBookingRepository = {
    findOne: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(PaymentEntity),
          useValue: mockPaymentRepository,
        },
        {
          provide: getRepositoryToken(RefundEntity),
          useValue: mockRefundRepository,
        },
        {
          provide: getRepositoryToken(WalletBalanceEntity),
          useValue: mockWalletBalanceRepository,
        },
        {
          provide: getRepositoryToken(WalletTransactionEntity),
          useValue: mockWalletTransactionRepository,
        },
        {
          provide: getRepositoryToken(BookingEntity),
          useValue: mockBookingRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    paymentRepository = module.get<Repository<PaymentEntity>>(
      getRepositoryToken(PaymentEntity),
    );
    refundRepository = module.get<Repository<RefundEntity>>(
      getRepositoryToken(RefundEntity),
    );
    walletBalanceRepository = module.get<Repository<WalletBalanceEntity>>(
      getRepositoryToken(WalletBalanceEntity),
    );
    walletTransactionRepository = module.get<
      Repository<WalletTransactionEntity>
    >(getRepositoryToken(WalletTransactionEntity));
    bookingRepository = module.get<Repository<BookingEntity>>(
      getRepositoryToken(BookingEntity),
    );
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create payment with discount breakdown from booking', async () => {
      const createPaymentDto: CreatePaymentDto = {
        bookingId: 'booking-1',
        userId: 'user-1',
        amount: 80,
        method: PaymentMethod.CREDIT_CARD,
      };

      mockBookingRepository.findOne.mockResolvedValue(mockBooking);
      mockPaymentRepository.create.mockReturnValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue(mockPayment);

      const result = await service.createPayment(createPaymentDto);

      expect(mockBookingRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
      });
      expect(mockPaymentRepository.create).toHaveBeenCalledWith({
        ...createPaymentDto,
        breakdown: {
          baseAmount: 100,
          discountAmount: 20,
          totalAmount: 80,
        },
      });
      expect(result).toEqual(mockPayment);
    });

    it('should create payment without discount when no booking found', async () => {
      const createPaymentDto: CreatePaymentDto = {
        bookingId: 'booking-1',
        userId: 'user-1',
        amount: 100,
        method: PaymentMethod.CREDIT_CARD,
      };

      mockBookingRepository.findOne.mockResolvedValue(null);
      mockPaymentRepository.create.mockReturnValue({
        ...mockPayment,
        amount: 100,
        breakdown: {
          baseAmount: 100,
          discountAmount: 0,
          totalAmount: 100,
        },
      });
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        amount: 100,
        breakdown: {
          baseAmount: 100,
          discountAmount: 0,
          totalAmount: 100,
        },
      });

      const result = await service.createPayment(createPaymentDto);

      expect(mockPaymentRepository.create).toHaveBeenCalledWith({
        ...createPaymentDto,
        breakdown: {
          baseAmount: 100,
          discountAmount: 0,
          totalAmount: 100,
        },
      });
      expect(result.breakdown.discountAmount).toBe(0);
    });

    it('should create payment without discount when booking has no discount', async () => {
      const bookingWithoutDiscount = {
        ...mockBooking,
        discountAmount: 0,
        totalAmount: 100,
        couponCode: null,
        couponId: null,
      };

      const createPaymentDto: CreatePaymentDto = {
        bookingId: 'booking-1',
        userId: 'user-1',
        amount: 100,
        method: PaymentMethod.CREDIT_CARD,
      };

      mockBookingRepository.findOne.mockResolvedValue(bookingWithoutDiscount);
      mockPaymentRepository.create.mockReturnValue({
        ...mockPayment,
        amount: 100,
        breakdown: {
          baseAmount: 100,
          discountAmount: 0,
          totalAmount: 100,
        },
      });
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        amount: 100,
        breakdown: {
          baseAmount: 100,
          discountAmount: 0,
          totalAmount: 100,
        },
      });

      const result = await service.createPayment(createPaymentDto);

      expect(result.breakdown.discountAmount).toBe(0);
      expect(result.breakdown.baseAmount).toBe(100);
      expect(result.breakdown.totalAmount).toBe(100);
    });
  });

  describe('findAll', () => {
    it('should return all payments', async () => {
      const payments = [mockPayment];
      mockPaymentRepository.find.mockResolvedValue(payments);

      const result = await service.findAll();

      expect(mockPaymentRepository.find).toHaveBeenCalled();
      expect(result).toEqual(payments);
    });
  });

  describe('findOne', () => {
    it('should return a payment by id', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);

      const result = await service.findOne('payment-1');

      expect(mockPaymentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
      });
      expect(result).toEqual(mockPayment);
    });

    it('should throw NotFoundException when payment not found', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      const processPaymentDto: ProcessPaymentDto = {
        paymentId: 'payment-1',
        paymentIntentId: 'pi_test123',
      };

      const processedPayment = {
        ...mockPayment,
        status: PaymentStatus.Completed,
        paymentIntentId: 'pi_test123',
      };

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue(processedPayment);

      const result = await service.processPayment(processPaymentDto);

      expect(mockPaymentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
      });
      expect(mockPaymentRepository.save).toHaveBeenCalledWith({
        ...mockPayment,
        status: PaymentStatus.Completed,
        paymentIntentId: 'pi_test123',
        processedAt: expect.any(Date),
      });
      expect(result.status).toBe(PaymentStatus.Completed);
    });

    it('should throw NotFoundException when payment not found', async () => {
      const processPaymentDto: ProcessPaymentDto = {
        paymentId: 'non-existent',
        paymentIntentId: 'pi_test123',
      };

      mockPaymentRepository.findOne.mockResolvedValue(null);

      await expect(service.processPayment(processPaymentDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when payment already processed', async () => {
      const processedPayment = {
        ...mockPayment,
        status: PaymentStatus.Completed,
      };

      const processPaymentDto: ProcessPaymentDto = {
        paymentId: 'payment-1',
        paymentIntentId: 'pi_test123',
      };

      mockPaymentRepository.findOne.mockResolvedValue(processedPayment);

      await expect(service.processPayment(processPaymentDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getPaymentsByUser', () => {
    it('should return payments for a specific user', async () => {
      const userPayments = [mockPayment];
      mockPaymentRepository.find.mockResolvedValue(userPayments);

      const result = await service.getPaymentsByUser('user-1');

      expect(mockPaymentRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(userPayments);
    });
  });

  describe('getPaymentsByBooking', () => {
    it('should return payments for a specific booking', async () => {
      const bookingPayments = [mockPayment];
      mockPaymentRepository.find.mockResolvedValue(bookingPayments);

      const result = await service.getPaymentsByBooking('booking-1');

      expect(mockPaymentRepository.find).toHaveBeenCalledWith({
        where: { bookingId: 'booking-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(bookingPayments);
    });
  });
});

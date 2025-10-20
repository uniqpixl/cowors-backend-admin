import { Role, UserStatus } from '@/api/user/user.enum';
import { UserEntity } from '@/auth/entities/user.entity';
import {
  BookingStatus,
  PaymentGateway,
  PaymentStatus,
} from '@/common/enums/booking.enum';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from '@/common/enums/notification.enum';
import {
  PartnerStatus,
  PartnerType,
  SpaceSubtype,
  VerificationStatus,
} from '@/common/enums/partner.enum';
import { PaymentMethod } from '@/common/enums/payment.enum';
import { ReviewType } from '@/common/enums/review.enum';
import { BookingModel, SpaceStatus } from '@/common/enums/space.enum';
import { TransactionStatus, TransactionType } from '@/common/enums/wallet.enum';
import { BookingEntity } from '@/database/entities/booking.entity';
import {
  InvoiceEntity,
  InvoiceStatus,
  TaxType,
} from '@/database/entities/invoice.entity';
import {
  NotificationCategory,
  NotificationEntity,
} from '@/database/entities/notification.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { PaymentEntity } from '@/database/entities/payment.entity';
import { ReviewEntity } from '@/database/entities/review.entity';
import { SpaceEntity } from '@/database/entities/space.entity';
import {
  TransactionSource,
  WalletTransactionEntity,
} from '@/database/entities/wallet-transaction.entity';
import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';

export class ComprehensiveSeed1756752400000 implements Seeder {
  track = true;

  public async run(
    dataSource: DataSource,
    _: SeederFactoryManager,
  ): Promise<any> {
    const userRepository = dataSource.getRepository(UserEntity);
    const partnerRepository = dataSource.getRepository(PartnerEntity);
    const spaceRepository = dataSource.getRepository(SpaceEntity);
    const bookingRepository = dataSource.getRepository(BookingEntity);
    const notificationRepository = dataSource.getRepository(NotificationEntity);
    const reviewRepository = dataSource.getRepository(ReviewEntity);
    const paymentRepository = dataSource.getRepository(PaymentEntity);
    const invoiceRepository = dataSource.getRepository(InvoiceEntity);
    const walletTransactionRepository = dataSource.getRepository(
      WalletTransactionEntity,
    );

    console.log('🌱 Starting comprehensive seeding...');

    // Create additional users for realistic data
    const additionalUsers = [];
    const userEmails = [
      'john.doe@example.com',
      'jane.smith@example.com',
      'mike.johnson@example.com',
      'sarah.wilson@example.com',
      'david.brown@example.com',
      'lisa.davis@example.com',
      'tom.miller@example.com',
      'emma.garcia@example.com',
      'alex.martinez@example.com',
      'olivia.anderson@example.com',
    ];

    for (let i = 0; i < userEmails.length; i++) {
      const existingUser = await userRepository.findOne({
        where: { email: userEmails[i] },
      });

      if (!existingUser) {
        const user = userRepository.create({
          username: userEmails[i].split('@')[0],
          email: userEmails[i],
          firstName:
            userEmails[i].split('.')[0].charAt(0).toUpperCase() +
            userEmails[i].split('.')[0].slice(1),
          lastName:
            userEmails[i].split('.')[1].split('@')[0].charAt(0).toUpperCase() +
            userEmails[i].split('.')[1].split('@')[0].slice(1),
          role: Role.User,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          image: `/img/user-${i + 1}.jpg`,
          bio: `Regular user who enjoys coworking spaces`,
        });
        const savedUser = await userRepository.save(user);
        additionalUsers.push(savedUser);
        console.log(`Created user: ${savedUser.email}`);
      }
    }

    // Get existing spaces and partners
    const existingSpaces = await spaceRepository.find({
      relations: ['partner'],
    });
    const existingPartners = await partnerRepository.find();
    const allUsers = await userRepository.find();

    if (existingSpaces.length === 0 || allUsers.length === 0) {
      console.log(
        '⚠️ No existing spaces or users found. Please run basic seeding first.',
      );
      return;
    }

    // Create bookings using direct SQL insert (TypeORM entity has issues)
    const bookings: any[] = [];
    const bookingStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

    for (let i = 0; i < 50; i++) {
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const randomSpace =
        existingSpaces[Math.floor(Math.random() * existingSpaces.length)];
      const randomStatus =
        bookingStatuses[Math.floor(Math.random() * bookingStatuses.length)];

      const startDate = new Date(
        Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000,
      );
      const duration = [60, 120, 180, 240, 480][Math.floor(Math.random() * 5)];
      const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

      const baseAmount = 500 * (duration / 60);
      const taxAmount = baseAmount * 0.18;
      const totalAmount = baseAmount + taxAmount;

      const bookingNumber = `BK${Date.now()}${i}`;

      // Insert booking using raw SQL
      const result = await dataSource.query(
        `
        INSERT INTO booking (
          id, "userId", "spaceId", "bookingNumber", "startDateTime", "endDateTime", 
          duration, "guestCount", "baseAmount", "extrasAmount", "discountAmount", 
          "taxAmount", "totalAmount", currency, status, "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
        ) RETURNING id;
      `,
        [
          randomUser.id,
          randomSpace.id,
          bookingNumber,
          startDate,
          endDate,
          duration,
          Math.floor(Math.random() * 5) + 1,
          baseAmount,
          0,
          0,
          taxAmount,
          totalAmount,
          'INR',
          randomStatus,
        ],
      );

      bookings.push({ id: result[0].id, userId: randomUser.id, totalAmount });
    }
    console.log(`Created ${bookings.length} bookings using SQL`);

    // Create notifications (skipped - notification table doesn't exist yet)
    // const notificationTypes = [NotificationType.BOOKING_CONFIRMED, NotificationType.BOOKING_CANCELLED, NotificationType.PAYMENT_SUCCESS, NotificationType.SYSTEM_UPDATE];
    // const notificationCategories = [NotificationCategory.BOOKING, NotificationCategory.PAYMENT, NotificationCategory.SYSTEM];
    //
    // for (let i = 0; i < 30; i++) {
    //   const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
    //   const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    //   const randomCategory = notificationCategories[Math.floor(Math.random() * notificationCategories.length)];
    //
    //   const notification = notificationRepository.create({
    //     userId: randomUser.id,
    //     notificationId: `notif_${Date.now()}_${i}`,
    //     type: randomType,
    //     category: randomCategory,
    //     priority: Math.random() > 0.7 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
    //     title: `Notification ${i + 1}`,
    //     message: `This is notification message ${i + 1}`,
    //     status: Math.random() > 0.3 ? NotificationStatus.UNREAD : NotificationStatus.READ,
    //     referenceId: `ref_${i}`,
    //     referenceType: 'booking',
    //     data: {
    //       actionUrl: '/dashboard',
    //     },
    //     sentAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    //     readAt: Math.random() > 0.5 ? new Date() : null,
    //     metadata: {
    //       source: 'system',
    //       campaign: 'user_engagement',
    //     },
    //   });
    //
    //   await notificationRepository.save(notification);
    // }
    console.log('Skipped notifications (table does not exist)');

    // Create reviews
    for (let i = 0; i < 25; i++) {
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const randomSpace =
        existingSpaces[Math.floor(Math.random() * existingSpaces.length)];

      const review = reviewRepository.create({
        userId: randomUser.id,
        spaceId: randomSpace.id,
        type: ReviewType.SPACE,
        rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
        comment: `Great space! Really enjoyed working here. ${i % 3 === 0 ? 'Highly recommended!' : i % 3 === 1 ? 'Will definitely come back.' : 'Perfect for remote work.'}`,
        isVerified: true,
        helpfulCount: Math.floor(Math.random() * 10),
      });

      await reviewRepository.save(review);
    }
    console.log('Created 25 reviews');

    // Create payments for some bookings (skipped for now due to schema mismatch)
    // let paymentCount = 0;
    // for (let i = 0; i < Math.min(bookings.length, 30); i++) {
    //   if (Math.random() > 0.3) { // Create payments for 70% of bookings
    //     const payment = paymentRepository.create({
    //       bookingId: bookings[i].id,
    //       userId: bookings[i].userId,
    //       paymentId: `pay_${Date.now()}_${i}`,
    //       gatewayPaymentId: `txn_${Date.now()}_${i}`,
    //       gatewayOrderId: `ord_${Date.now()}_${i}`,
    //       gateway: PaymentGateway.STRIPE,
    //       method: Math.random() > 0.5 ? PaymentMethod.CREDIT_CARD : PaymentMethod.DEBIT_CARD,
    //       amount: bookings[i].totalAmount,
    //       currency: 'INR',
    //       status: PaymentStatus.COMPLETED,
    //       paidAt: new Date(),
    //       gatewayResponse: {
    //         transactionId: `txn_${Date.now()}_${i}`,
    //         cardLast4: '1234',
    //       },
    //       breakdown: {
    //         baseAmount: bookings[i].totalAmount * 0.9,
    //         extrasAmount: 0,
    //         taxAmount: bookings[i].totalAmount * 0.1,
    //         discountAmount: 0,
    //         convenienceFee: 0,
    //         gatewayFee: bookings[i].totalAmount * 0.02,
    //         totalAmount: bookings[i].totalAmount,
    //       },
    //     });
    //
    //     await paymentRepository.save(payment);
    //     paymentCount++;
    //   }
    // }
    console.log('Skipped payments (schema mismatch - will create separately)');

    // Create invoices (skipped for now due to schema mismatch)
    // for (let i = 0; i < 20; i++) {
    //   const randomBooking = bookings[Math.floor(Math.random() * bookings.length)];
    //   const randomPartner = existingPartners[Math.floor(Math.random() * existingPartners.length)];
    //   const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
    //
    //   const invoice = invoiceRepository.create({
    //     invoiceNumber: `INV-${Date.now()}-${i.toString().padStart(3, '0')}`,
    //     userId: randomUser.id,
    //     partnerId: randomPartner.id,
    //     bookingId: randomBooking.id,
    //     status: Math.random() > 0.3 ? InvoiceStatus.PAID : InvoiceStatus.SENT,
    //     taxType: TaxType.GST,
    //     issueDate: new Date(),
    //     dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    //     subtotal: randomBooking.totalAmount * 0.9,
    //     totalTax: randomBooking.totalAmount * 0.1,
    //     totalAmount: randomBooking.totalAmount,
    //     currency: 'INR',
    //     billingAddress: {
    //       name: `${randomUser.firstName} ${randomUser.lastName}`,
    //       email: randomUser.email,
    //       addressLine1: '123 Business Street',
    //       city: 'Mumbai',
    //       state: 'Maharashtra',
    //       postalCode: '400001',
    //       country: 'India',
    //     },
    //     lineItems: [
    //       {
    //         description: 'Space booking fee',
    //         quantity: 1,
    //         unitPrice: randomBooking.totalAmount * 0.8,
    //         amount: randomBooking.totalAmount * 0.8,
    //       },
    //       {
    //         description: 'Service fee',
    //         quantity: 1,
    //         unitPrice: randomBooking.totalAmount * 0.1,
    //         amount: randomBooking.totalAmount * 0.1,
    //       },
    //     ],
    //     taxBreakdown: {
    //       cgst: {
    //         rate: 9,
    //         amount: randomBooking.totalAmount * 0.045,
    //       },
    //       sgst: {
    //         rate: 9,
    //         amount: randomBooking.totalAmount * 0.045,
    //       },
    //       totalTaxRate: 18,
    //       totalTaxAmount: randomBooking.totalAmount * 0.1,
    //     },
    //     metadata: {
    //       currency: 'INR',
    //       paymentTerms: '30 days',
    //       notes: 'Thank you for your business',
    //     },
    //   });
    //
    //   await invoiceRepository.save(invoice);
    // }
    console.log('Skipped invoices (schema mismatch - will create separately)');

    // Create wallet transactions (skip for now as it requires wallet balance setup)
    // for (let i = 0; i < 15; i++) {
    //   const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
    //   const transactionTypes = [TransactionType.CREDIT, TransactionType.DEBIT];
    //   const randomType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
    //
    //   const transaction = walletTransactionRepository.create({
    //     userId: randomUser.id,
    //     walletBalanceId: 'wallet-balance-id', // Would need to create wallet balance first
    //     transactionId: `txn_${Date.now()}_${i}`,
    //     type: randomType,
    //     source: randomType === TransactionType.CREDIT ? TransactionSource.BOOKING_REFUND : TransactionSource.BOOKING_PAYMENT,
    //     amount: Math.floor(Math.random() * 1000) + 100,
    //     balanceAfter: Math.floor(Math.random() * 5000) + 1000,
    //     currency: 'INR',
    //     description: randomType === TransactionType.CREDIT ? 'Refund for cancelled booking' : 'Payment for booking',
    //     status: TransactionStatus.COMPLETED,
    //     referenceId: `ref_${Date.now()}_${i}`,
    //     processedAt: new Date(),
    //   });
    //
    //   await walletTransactionRepository.save(transaction);
    // }
    console.log('Skipped wallet transactions (requires wallet balance setup)');

    console.log('🎉 Comprehensive seeding completed successfully!');
  }
}

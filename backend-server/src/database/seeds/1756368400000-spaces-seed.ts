import { Role, UserStatus } from '@/api/user/user.enum';
import { UserEntity } from '@/auth/entities/user.entity';
import {
  PartnerStatus,
  PartnerType,
  SpaceSubtype,
  VerificationStatus,
} from '@/common/enums/partner.enum';
import { BookingModel, SpaceStatus } from '@/common/enums/space.enum';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { SpaceEntity } from '@/database/entities/space.entity';
import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';

export class SpacesSeed1756368400000 implements Seeder {
  track = true;

  public async run(
    dataSource: DataSource,
    _: SeederFactoryManager,
  ): Promise<any> {
    const userRepository = dataSource.getRepository(UserEntity);
    const partnerRepository = dataSource.getRepository(PartnerEntity);
    const spaceRepository = dataSource.getRepository(SpaceEntity);

    // Create users
    const timestamp = Date.now();
    const users = [];

    for (let i = 1; i <= 3; i++) {
      const user = userRepository.create({
        username: `spaceowner_${timestamp}_${i}`,
        email: `owner${i}_${timestamp}@example.com`,
        firstName: `Owner${i}`,
        lastName: 'User',
        role: Role.User,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      });
      const savedUser = await userRepository.save(user);
      users.push(savedUser);
      console.log(`Created user: ${savedUser.id}`);
    }

    // Create partners
    const partners = [];
    const businessNames = [
      'Downtown Coworking',
      'Tech Hub Spaces',
      'Creative Studio',
    ];

    for (let i = 0; i < users.length; i++) {
      const partnerData = {
        userId: users[i].id,
        user: users[i],
        businessName: businessNames[i],
        businessType: PartnerType.SPACE,
        businessSubtype: SpaceSubtype.COWORKING_SPACE,
        verificationStatus: VerificationStatus.VERIFIED,
        status: PartnerStatus.ACTIVE,
        createdByUserId: users[i].id,
        updatedByUserId: users[i].id,
        address: {
          street: `${100 + i * 50} Main St`,
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          postalCode: `9410${i}`,
          coordinates: {
            latitude: 37.7749 + i * 0.01,
            longitude: -122.4194 + i * 0.01,
          },
        },
        contactInfo: {
          phone: `+1-555-000${i}`,
          email: `contact@${businessNames[i].toLowerCase().replace(/\s+/g, '')}.com`,
        },
        businessDetails: {
          description: `A modern ${businessNames[i].toLowerCase()} space for professionals`,
          establishedYear: 2020 + i,
        },
        rating: 4.5 + i * 0.2,
        reviewCount: 10 + i * 5,
      };
      const partner = partnerRepository.create(partnerData);
      const savedPartner = await partnerRepository.save(partner);
      partners.push(savedPartner);
      console.log(`Created partner: ${savedPartner.id}`);
    }

    // Create spaces
    const spaceTypes = [
      SpaceSubtype.OFFICE_SPACE,
      SpaceSubtype.COWORKING_SPACE,
      SpaceSubtype.CAFE,
    ];
    const spaceNames = [
      'Executive Office',
      'Conference Room A',
      'Hot Desk Area',
    ];
    const bookingModels = [
      BookingModel.TIME_BASED,
      BookingModel.FLEXIBLE,
      BookingModel.TIME_BASED,
    ];

    for (let i = 0; i < partners.length; i++) {
      const spaceData = {
        partner: partners[i],
        name: spaceNames[i],
        description: `A comfortable ${spaceNames[i].toLowerCase()} perfect for productivity`,
        spaceType: spaceTypes[i],
        capacity: 2 + i * 2,
        bookingModel: bookingModels[i],
        pricing: {
          basePrice: 25 + i * 15,
          currency: 'USD',
        },
        amenities: ['wifi', 'coffee', 'printer'],
        availabilityRules: {
          advanceBookingDays: 7,
          cancellationPolicy: {
            freeUntilHours: 24,
            partialRefundUntilHours: 2,
            refundPercentage: 50,
          },
          operatingHours: {
            monday: { open: '09:00', close: '18:00', isAvailable: true },
            tuesday: { open: '09:00', close: '18:00', isAvailable: true },
            wednesday: { open: '09:00', close: '18:00', isAvailable: true },
            thursday: { open: '09:00', close: '18:00', isAvailable: true },
            friday: { open: '09:00', close: '18:00', isAvailable: true },
            saturday: { open: '10:00', close: '16:00', isAvailable: false },
            sunday: { open: '10:00', close: '16:00', isAvailable: false },
          },
        },
        address: {
          street: `${100 + i * 50} Main St, Floor ${i + 1}, Room ${i + 1}0${i + 1}`,
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          postalCode: `9410${i}`,
        },
        coordinates: {
          latitude: 37.7749 + i * 0.01,
          longitude: -122.4194 + i * 0.01,
        },
        images: [
          {
            url: `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20coworking%20space%20${i + 1}&image_size=landscape_4_3`,
            alt: `${spaceNames[i]} image`,
            isPrimary: true,
          },
        ],
        status: SpaceStatus.ACTIVE,
      };
      const space = spaceRepository.create(spaceData);
      const savedSpace = await spaceRepository.save(space);
      console.log(`Created space: ${savedSpace.id}`);
    }

    console.log('Spaces seeding completed successfully!');
  }
}

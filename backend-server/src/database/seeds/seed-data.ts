import { DataSource } from 'typeorm';
import { Role, UserStatus } from '../../api/user/user.enum';
import { UserEntity } from '../../auth/entities/user.entity';
import { BookingStatus, ExtrasCategory } from '../../common/enums/booking.enum';
import {
  PartnerStatus,
  PartnerType,
  SpaceSubtype,
  VerificationStatus,
} from '../../common/enums/partner.enum';
import { BookingModel, SpaceStatus } from '../../common/enums/space.enum';
import {
  BookingItemEntity,
  BookingItemType,
} from '../entities/booking-item.entity';
import { BookingEntity } from '../entities/booking.entity';
import {
  CityEntity,
  LaunchStatus,
  TierClassification,
} from '../entities/city.entity';
import { NeighborhoodEntity } from '../entities/neighborhood.entity';
import {
  ApprovalStatus,
  ListingType,
  PartnerListingEntity,
} from '../entities/partner-listing.entity';
import {
  PartnerLocationEntity,
  PrivacyLevel,
} from '../entities/partner-location.entity';
import { PartnerEntity } from '../entities/partner.entity';
import {
  SpaceOptionEntity,
  SpaceOptionStatus,
  SpaceOptionType,
} from '../entities/space-option.entity';
import { SpaceEntity } from '../entities/space.entity';

export async function seedDatabase(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(UserEntity);
  const partnerRepository = dataSource.getRepository(PartnerEntity);
  const spaceRepository = dataSource.getRepository(SpaceEntity);
  const cityRepository = dataSource.getRepository(CityEntity);
  const neighborhoodRepository = dataSource.getRepository(NeighborhoodEntity);
  const locationRepository = dataSource.getRepository(PartnerLocationEntity);
  const listingRepository = dataSource.getRepository(PartnerListingEntity);
  const spaceOptionRepository = dataSource.getRepository(SpaceOptionEntity);
  const bookingRepository = dataSource.getRepository(BookingEntity);
  const bookingItemRepository = dataSource.getRepository(BookingItemEntity);

  console.log('Starting database seeding...');

  // Seed cities
  const cities: Array<Partial<CityEntity> & { name: string }> = [
    {
      name: 'Bangalore',
      state: 'Karnataka',
      launch_status: LaunchStatus.ACTIVE,
      tier_classification: TierClassification.TIER_1,
      gst_state_code: '29',
      expansion_priority: 10,
    },
    {
      name: 'Gurgaon',
      state: 'Haryana',
      launch_status: LaunchStatus.ACTIVE,
      tier_classification: TierClassification.TIER_1,
      gst_state_code: '06',
      expansion_priority: 8,
    },
    {
      name: 'Mumbai',
      state: 'Maharashtra',
      launch_status: LaunchStatus.ACTIVE,
      tier_classification: TierClassification.TIER_1,
      gst_state_code: '27',
      expansion_priority: 9,
    },
    {
      name: 'Pune',
      state: 'Maharashtra',
      launch_status: LaunchStatus.LAUNCHING,
      tier_classification: TierClassification.TIER_2,
      gst_state_code: '27',
      expansion_priority: 7,
    },
    {
      name: 'Delhi',
      state: 'Delhi',
      launch_status: LaunchStatus.ACTIVE,
      tier_classification: TierClassification.TIER_1,
      gst_state_code: '07',
      expansion_priority: 9,
    },
  ];

  const createdCities: Record<string, CityEntity> = {};
  for (const c of cities) {
    const existing = await cityRepository.findOne({ where: { name: c.name } });
    if (existing) {
      createdCities[c.name] = existing;
      console.log(`City already exists: ${c.name} (${existing.id})`);
      continue;
    }
    const city = cityRepository.create(c);
    const savedCity = await cityRepository.save(city);
    createdCities[c.name] = savedCity;
    console.log(`Created city: ${c.name} (${savedCity.id})`);
  }

  // Seed neighborhoods per city
  const neighborhoodsSeed: Array<{
    cityName: string;
    name: string;
    display_name?: string;
    popular_tags?: string[];
    is_popular?: boolean;
  }> = [
    {
      cityName: 'Bangalore',
      name: 'Indiranagar',
      display_name: 'Indiranagar',
      popular_tags: ['cafe', 'workspace'],
      is_popular: true,
    },
    {
      cityName: 'Bangalore',
      name: 'Koramangala',
      display_name: 'Koramangala',
      popular_tags: ['startup', 'coworking'],
      is_popular: true,
    },
    {
      cityName: 'Gurgaon',
      name: 'Cyber City',
      display_name: 'DLF Cyber City',
      popular_tags: ['coworking', 'office'],
      is_popular: true,
    },
    {
      cityName: 'Mumbai',
      name: 'MG Road',
      display_name: 'MG Road',
      popular_tags: ['cafe', 'shopping'],
      is_popular: true,
    },
    {
      cityName: 'Delhi',
      name: 'Connaught Place',
      display_name: 'CP',
      popular_tags: ['central', 'business'],
      is_popular: true,
    },
    {
      cityName: 'Pune',
      name: 'Kothrud',
      display_name: 'Kothrud',
      popular_tags: ['libraries', 'quiet'],
      is_popular: false,
    },
  ];

  const createdNeighborhoods: Record<string, NeighborhoodEntity> = {};
  for (const n of neighborhoodsSeed) {
    const city = createdCities[n.cityName];
    if (!city) continue;
    const key = `${n.cityName}:${n.name}`;
    const existing = await neighborhoodRepository.findOne({
      where: { city_id: city.id, name: n.name },
    });
    if (existing) {
      createdNeighborhoods[key] = existing;
      console.log(
        `Neighborhood already exists: ${n.name} in ${n.cityName} (${existing.id})`,
      );
      continue;
    }
    const neighborhood = neighborhoodRepository.create({
      city_id: city.id,
      name: n.name,
      display_name: n.display_name,
      popular_tags: n.popular_tags || [],
      is_popular: !!n.is_popular,
    });
    const savedNeighborhood = await neighborhoodRepository.save(neighborhood);
    createdNeighborhoods[key] = savedNeighborhood;
    console.log(
      `Created neighborhood: ${n.name} in ${n.cityName} (${savedNeighborhood.id})`,
    );
  }

  // Create test users
  const users = [
    {
      username: 'thirdwave_owner',
      email: 'owner@thirdwavecoffee.com',
      isEmailVerified: true,
      role: Role.Partner,
      status: UserStatus.ACTIVE,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      image: '/img/logo-1.png',
      bio: 'Coffee enthusiast and business owner',
    },
    {
      username: 'wework_admin',
      email: 'admin@wework.com',
      isEmailVerified: true,
      role: Role.Partner,
      status: UserStatus.ACTIVE,
      firstName: 'Priya',
      lastName: 'Sharma',
      image: '/img/team-2.jpg',
      bio: 'Coworking space manager',
    },
    {
      username: 'starbucks_manager',
      email: 'manager@starbucks.com',
      isEmailVerified: true,
      role: Role.Partner,
      status: UserStatus.ACTIVE,
      firstName: 'Amit',
      lastName: 'Patel',
      image: '/img/team-3.jpg',
      bio: 'Coffee chain manager',
    },
    {
      username: 'library_admin',
      email: 'admin@citylibrary.com',
      isEmailVerified: true,
      role: Role.Partner,
      status: UserStatus.INACTIVE,
      firstName: 'Sneha',
      lastName: 'Reddy',
      image: '/img/team-4.jpg',
      bio: 'Library administrator',
    },
    {
      username: 'hotel_owner',
      email: 'owner@grandhotel.com',
      isEmailVerified: false,
      role: Role.Partner,
      status: UserStatus.INACTIVE,
      firstName: 'Vikram',
      lastName: 'Singh',
      image: '/img/team-5.jpg',
      bio: 'Hotel business owner',
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const existingUser = await userRepository.findOne({
      where: { email: userData.email },
    });
    if (!existingUser) {
      const user = userRepository.create(userData);
      const savedUser = await userRepository.save(user);
      createdUsers.push(savedUser);
      console.log(`Created user: ${userData.email} with ID: ${savedUser.id}`);
    } else {
      createdUsers.push(existingUser);
      console.log(
        `User already exists: ${userData.email} with ID: ${existingUser.id}`,
      );
    }
  }

  // Create test partners
  const partnerData = [
    {
      businessName: 'Third Wave Coffee',
      businessType: PartnerType.SPACE,
      businessSubtype: SpaceSubtype.CAFE,
      address: {
        street: '123 Coffee Street',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560038',
        coordinates: {
          latitude: 12.9716,
          longitude: 77.5946,
        },
      },
      contactInfo: {
        phone: '+91-9876543210',
        email: 'contact@thirdwavecoffee.com',
        website: 'https://thirdwavecoffee.com',
      },
      verificationStatus: VerificationStatus.VERIFIED,
      status: PartnerStatus.ACTIVE,
      businessDetails: {
        description: 'Premium artisanal coffee shop with workspace facilities',
        establishedYear: 2020,
        licenseNumber: 'CAFE-2020-001',
      },
      operatingHours: {
        monday: { open: '07:00', close: '22:00', isOpen: true },
        tuesday: { open: '07:00', close: '22:00', isOpen: true },
        wednesday: { open: '07:00', close: '22:00', isOpen: true },
        thursday: { open: '07:00', close: '22:00', isOpen: true },
        friday: { open: '07:00', close: '22:00', isOpen: true },
        saturday: { open: '08:00', close: '23:00', isOpen: true },
        sunday: { open: '08:00', close: '21:00', isOpen: true },
      },
      rating: 4.8,
      reviewCount: 156,
      commissionRate: 15.0,
    },
    {
      businessName: 'WeWork Cyber City',
      businessType: PartnerType.SPACE,
      businessSubtype: SpaceSubtype.COWORKING_SPACE,
      address: {
        street: 'DLF Cyber City',
        city: 'Gurgaon',
        state: 'Haryana',
        country: 'India',
        postalCode: '122002',
        coordinates: {
          latitude: 28.4949,
          longitude: 77.0869,
        },
      },
      contactInfo: {
        phone: '+91-9876543211',
        email: 'contact@wework.com',
        website: 'https://wework.com',
      },
      verificationStatus: VerificationStatus.VERIFIED,
      status: PartnerStatus.ACTIVE,
      businessDetails: {
        description: 'Modern coworking space with premium amenities',
        establishedYear: 2018,
        licenseNumber: 'COWORK-2018-001',
      },
      operatingHours: {
        monday: { open: '06:00', close: '23:00', isOpen: true },
        tuesday: { open: '06:00', close: '23:00', isOpen: true },
        wednesday: { open: '06:00', close: '23:00', isOpen: true },
        thursday: { open: '06:00', close: '23:00', isOpen: true },
        friday: { open: '06:00', close: '23:00', isOpen: true },
        saturday: { open: '08:00', close: '20:00', isOpen: true },
        sunday: { open: '08:00', close: '20:00', isOpen: true },
      },
      rating: 4.7,
      reviewCount: 89,
      commissionRate: 20.0,
    },
    {
      businessName: 'Starbucks Coffee',
      businessType: PartnerType.SPACE,
      businessSubtype: SpaceSubtype.CAFE,
      address: {
        street: '456 MG Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '400001',
        coordinates: {
          latitude: 19.076,
          longitude: 72.8777,
        },
      },
      contactInfo: {
        phone: '+91-9876543212',
        email: 'contact@starbucks.com',
        website: 'https://starbucks.com',
      },
      verificationStatus: VerificationStatus.PENDING,
      status: PartnerStatus.DRAFT,
      businessDetails: {
        description: 'Global coffee chain with workspace-friendly environment',
        establishedYear: 2012,
        licenseNumber: 'CAFE-2012-003',
      },
      operatingHours: {
        monday: { open: '06:00', close: '23:00', isOpen: true },
        tuesday: { open: '06:00', close: '23:00', isOpen: true },
        wednesday: { open: '06:00', close: '23:00', isOpen: true },
        thursday: { open: '06:00', close: '23:00', isOpen: true },
        friday: { open: '06:00', close: '23:00', isOpen: true },
        saturday: { open: '07:00', close: '24:00', isOpen: true },
        sunday: { open: '07:00', close: '22:00', isOpen: true },
      },
      rating: 4.2,
      reviewCount: 234,
      commissionRate: 12.0,
    },
    {
      businessName: 'City Central Library',
      businessType: PartnerType.SPACE,
      businessSubtype: SpaceSubtype.COWORKING_SPACE,
      address: {
        street: '789 Knowledge Street',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '411001',
        coordinates: {
          latitude: 18.5204,
          longitude: 73.8567,
        },
      },
      contactInfo: {
        phone: '+91-9876543213',
        email: 'info@citylibrary.com',
        website: 'https://citylibrary.com',
      },
      verificationStatus: VerificationStatus.PENDING,
      status: PartnerStatus.DRAFT,
      businessDetails: {
        description:
          'Modern public library with study spaces and meeting rooms',
        establishedYear: 1995,
        licenseNumber: 'LIB-1995-001',
      },
      operatingHours: {
        monday: { open: '08:00', close: '20:00', isOpen: true },
        tuesday: { open: '08:00', close: '20:00', isOpen: true },
        wednesday: { open: '08:00', close: '20:00', isOpen: true },
        thursday: { open: '08:00', close: '20:00', isOpen: true },
        friday: { open: '08:00', close: '20:00', isOpen: true },
        saturday: { open: '09:00', close: '18:00', isOpen: true },
        sunday: { open: '10:00', close: '17:00', isOpen: true },
      },
      rating: 4.5,
      reviewCount: 67,
      commissionRate: 8.0,
    },
    {
      businessName: 'Grand Hotel Business Center',
      businessType: PartnerType.SPACE,
      businessSubtype: SpaceSubtype.OFFICE_SPACE,
      address: {
        street: '321 Luxury Avenue',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        postalCode: '110001',
        coordinates: {
          latitude: 28.6139,
          longitude: 77.209,
        },
      },
      contactInfo: {
        phone: '+91-9876543214',
        email: 'business@grandhotel.com',
        website: 'https://grandhotel.com',
      },
      verificationStatus: VerificationStatus.REJECTED,
      status: PartnerStatus.INACTIVE,
      businessDetails: {
        description:
          'Luxury hotel with premium business center and meeting facilities',
        establishedYear: 2005,
        licenseNumber: 'HOTEL-2005-001',
        rejectionReason:
          'Incomplete documentation - missing fire safety certificate',
        adminNotes:
          'Partner needs to provide updated fire safety compliance documents',
      },
      operatingHours: {
        monday: { open: '24:00', close: '24:00', isOpen: true },
        tuesday: { open: '24:00', close: '24:00', isOpen: true },
        wednesday: { open: '24:00', close: '24:00', isOpen: true },
        thursday: { open: '24:00', close: '24:00', isOpen: true },
        friday: { open: '24:00', close: '24:00', isOpen: true },
        saturday: { open: '24:00', close: '24:00', isOpen: true },
        sunday: { open: '24:00', close: '24:00', isOpen: true },
      },
      rating: 4.1,
      reviewCount: 45,
      commissionRate: 25.0,
    },
  ];

  // Create partners using the created users
  const createdPartners: PartnerEntity[] = [];
  for (let i = 0; i < Math.min(partnerData.length, createdUsers.length); i++) {
    const userData = createdUsers[i];
    const pData = partnerData[i];

    const existingPartner = await partnerRepository.findOne({
      where: { userId: userData.id },
    });

    if (!existingPartner) {
      const partner = partnerRepository.create({
        userId: userData.id,
        businessName: pData.businessName,
        businessType: pData.businessType,
        businessSubtype: pData.businessSubtype,
        contactInfo: pData.contactInfo,
        verificationStatus: pData.verificationStatus,
        status: pData.status,
        businessDetails: pData.businessDetails,
        operatingHours: pData.operatingHours,
        rating: pData.rating,
        reviewCount: pData.reviewCount,
        commissionRate: pData.commissionRate,
      });
      const savedPartner = await partnerRepository.save(partner);
      createdPartners.push(savedPartner);
      console.log(
        `Created partner: ${pData.businessName} with ID: ${savedPartner.id}`,
      );
    } else {
      createdPartners.push(existingPartner);
      console.log(
        `Partner already exists: ${pData.businessName} with ID: ${existingPartner.id}`,
      );
    }
  }

  // Create partner locations and listings
  const partnerLocations: PartnerLocationEntity[] = [];
  const partnerListings: PartnerListingEntity[] = [];

  for (let i = 0; i < createdPartners.length; i++) {
    const partner = createdPartners[i];
    const pData = partnerData[i];

    // Resolve city and neighborhood
    const city = createdCities[pData.address.city];
    const neighborhoodKey = `${pData.address.city}:${
      pData.address.city === 'Bangalore'
        ? 'Indiranagar'
        : pData.address.city === 'Gurgaon'
          ? 'Cyber City'
          : pData.address.city === 'Mumbai'
            ? 'MG Road'
            : pData.address.city === 'Delhi'
              ? 'Connaught Place'
              : 'Kothrud'
    }`;
    const neighborhood = createdNeighborhoods[neighborhoodKey];

    if (!city || !neighborhood) {
      console.warn(
        `Skipping location/listing for partner ${partner.businessName} due to missing city/neighborhood`,
      );
      continue;
    }

    // Create location
    const existingLocation = await locationRepository.findOne({
      where: {
        partner_id: partner.id,
        city_id: city.id,
        neighborhood_id: neighborhood.id,
      },
    });

    let savedLocation: PartnerLocationEntity;
    if (!existingLocation) {
      const location = locationRepository.create({
        partner_id: partner.id,
        city_id: city.id,
        neighborhood_id: neighborhood.id,
        address: `${pData.address.street}, ${pData.address.city}, ${pData.address.state}`,
        latitude: pData.address.coordinates.latitude,
        longitude: pData.address.coordinates.longitude,
        privacy_level: PrivacyLevel.NEIGHBORHOOD,
        operating_hours: partner.operatingHours as any,
        amenities: [],
        images: [],
        contact_info: partner.contactInfo as any,
        is_active: partner.status !== PartnerStatus.INACTIVE,
        location_metadata: {},
      });
      savedLocation = await locationRepository.save(location);
      partnerLocations.push(savedLocation);
      console.log(
        `Created location for partner: ${partner.businessName} (${savedLocation.id})`,
      );
    } else {
      savedLocation = existingLocation;
      partnerLocations.push(savedLocation);
      console.log(
        `Location already exists for partner: ${partner.businessName} (${savedLocation.id})`,
      );
    }

    // Create listing for the location
    const listingTypeMap: Record<string, ListingType> = {
      [SpaceSubtype.CAFE]: ListingType.CAFE,
      [SpaceSubtype.COWORKING_SPACE]: ListingType.COWORKING_SPACE,
      [SpaceSubtype.OFFICE_SPACE]: ListingType.OFFICE_SPACE,
    } as any;

    const approvalFromVerification: Record<VerificationStatus, ApprovalStatus> =
      {
        [VerificationStatus.VERIFIED]: ApprovalStatus.APPROVED,
        [VerificationStatus.PENDING]: ApprovalStatus.PENDING,
        [VerificationStatus.REJECTED]: ApprovalStatus.REJECTED,
        [VerificationStatus.SUSPENDED]: ApprovalStatus.SUSPENDED,
      };

    const existingListing = await listingRepository.findOne({
      where: {
        partner_id: partner.id,
        location_id: savedLocation.id,
        listing_type: listingTypeMap[partner.businessSubtype as any],
      },
    });

    let savedListing: PartnerListingEntity;
    if (!existingListing) {
      const listing = listingRepository.create({
        partner_id: partner.id,
        location_id: savedLocation.id,
        listing_type: listingTypeMap[partner.businessSubtype as any],
        listing_name: partner.businessName,
        description: partner.businessDetails?.description || '',
        approval_status: approvalFromVerification[partner.verificationStatus],
        is_active: partner.status !== PartnerStatus.INACTIVE,
        listing_metadata: {},
        images: [],
        amenities: [],
        operating_hours: partner.operatingHours as any,
        rating: partner.rating,
        review_count: partner.reviewCount,
        total_bookings: 0,
      });
      savedListing = await listingRepository.save(listing);
      partnerListings.push(savedListing);
      console.log(
        `Created listing for partner: ${partner.businessName} (${savedListing.id})`,
      );
    } else {
      savedListing = existingListing;
      partnerListings.push(savedListing);
      console.log(
        `Listing already exists for partner: ${partner.businessName} (${savedListing.id})`,
      );
    }
  }

  // Create test spaces using the created partners
  const spaceData = [
    {
      name: 'Third Wave Coffee - Premium Cafe Space',
      description:
        'Modern artisanal coffee shop with dedicated workspace areas, high-speed WiFi, power outlets, and premium coffee. Features quiet corners, outdoor seating, and meeting rooms. Perfect for remote work, meetings, and creative sessions.',
      spaceType: SpaceSubtype.CAFE,
      bookingModel: BookingModel.TIME_BASED,
      capacity: 50,
      amenities: [
        'High-Speed WiFi',
        'Premium Coffee & Tea',
        'Work-Friendly Tables',
        'Power Outlets',
        'Food & Beverages',
        'Outdoor Seating',
        'Ambient Music',
        'Natural Lighting',
        'Air Conditioning',
        'Quiet Zones',
        'Espresso Machine',
        'Cold Beverages',
        'Fresh Pastries',
        'Filtered Water',
        'Street Parking',
        'Wheelchair Accessible',
        'Meeting Space',
        'Printing Services',
      ],
      location: {
        area: 'Indiranagar',
        coordinates: {
          latitude: 12.9716,
          longitude: 77.5946,
        },
      },
      pricing: {
        basePrice: 150,
        currency: 'INR',
        pricePerHour: 50,
        pricePerDay: 400,
        minimumBookingHours: 1,
        maximumBookingHours: 12,
        discounts: {
          weeklyDiscount: 10,
          monthlyDiscount: 20,
        },
      },
      availabilityRules: {
        advanceBookingDays: 30,
        cancellationPolicy: {
          freeUntilHours: 24,
          partialRefundUntilHours: 2,
          refundPercentage: 50,
        },
        operatingHours: {
          monday: { open: '07:00', close: '22:00', isAvailable: true },
          tuesday: { open: '07:00', close: '22:00', isAvailable: true },
          wednesday: { open: '07:00', close: '22:00', isAvailable: true },
          thursday: { open: '07:00', close: '22:00', isAvailable: true },
          friday: { open: '07:00', close: '22:00', isAvailable: true },
          saturday: { open: '08:00', close: '23:00', isAvailable: true },
          sunday: { open: '08:00', close: '21:00', isAvailable: true },
        },
        minimumNoticeHours: 1,
      },
      images: [
        {
          url: '/img/cafe-hero-1.jpg',
          alt: 'Third Wave Coffee Interior',
          isPrimary: true,
        },
        {
          url: '/img/list-1.jpg',
          alt: 'Workspace Area',
          isPrimary: false,
        },
        {
          url: '/img/list-2.jpg',
          alt: 'Coffee Bar',
          isPrimary: false,
        },
        {
          url: '/img/list-3.jpg',
          alt: 'Outdoor Seating',
          isPrimary: false,
        },
      ],
      status: SpaceStatus.ACTIVE,
      rating: 4.8,
      reviewCount: 156,
      totalBookings: 1247,
      metadata: {
        wifi: true,
        parking: {
          available: true,
          type: 'free' as const,
          spaces: 20,
          instructions: 'Free parking available in the building',
        },
        accessibility: {
          wheelchairAccessible: true,
          elevatorAccess: true,
          accessibleParking: true,
          accessibleRestrooms: true,
        },
        petFriendly: false,
        smokingAllowed: false,
        alcoholAllowed: false,
        cateringAvailable: true,
        equipmentAvailable: ['Projector', 'Whiteboard', 'Sound System'],
      },
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440002',
      partnerId: '660e8400-e29b-41d4-a716-446655440002',
      name: 'WeWork Cyber City - Modern Coworking',
      description:
        'State-of-the-art coworking space with private offices, meeting rooms, and networking events. Ideal for startups and teams.',
      spaceType: SpaceSubtype.COWORKING_SPACE,
      bookingModel: BookingModel.TIME_BASED,
      capacity: 200,
      amenities: [
        'High-Speed WiFi',
        'Private Offices',
        'Meeting Rooms',
        'Hot Desks',
        'Dedicated Desks',
        'Phone Booths',
        'Printing Services',
        'Coffee & Tea',
        'Reception Services',
        'Mail Handling',
        'Networking Events',
        'Community Manager',
        'Parking',
        'Security',
        'Air Conditioning',
        'Natural Light',
      ],
      location: {
        area: 'Cyber City',
        floor: '5th Floor',
        coordinates: {
          latitude: 28.4949,
          longitude: 77.0869,
        },
      },
      pricing: {
        basePrice: 300,
        currency: 'INR',
        pricePerHour: 100,
        pricePerDay: 800,
        pricePerWeek: 5000,
        pricePerMonth: 18000,
        minimumBookingHours: 4,
        maximumBookingHours: 24,
        discounts: {
          weeklyDiscount: 15,
          monthlyDiscount: 25,
        },
      },
      availabilityRules: {
        advanceBookingDays: 60,
        cancellationPolicy: {
          freeUntilHours: 48,
          partialRefundUntilHours: 4,
          refundPercentage: 75,
        },
        operatingHours: {
          monday: { open: '06:00', close: '23:00', isAvailable: true },
          tuesday: { open: '06:00', close: '23:00', isAvailable: true },
          wednesday: { open: '06:00', close: '23:00', isAvailable: true },
          thursday: { open: '06:00', close: '23:00', isAvailable: true },
          friday: { open: '06:00', close: '23:00', isAvailable: true },
          saturday: { open: '08:00', close: '20:00', isAvailable: true },
          sunday: { open: '08:00', close: '20:00', isAvailable: true },
        },
        minimumNoticeHours: 2,
      },
      images: [
        {
          url: '/img/list-2.jpg',
          alt: 'WeWork Main Area',
          isPrimary: true,
        },
        {
          url: '/img/list-3.jpg',
          alt: 'Private Office',
          isPrimary: false,
        },
        {
          url: '/img/list-4.jpg',
          alt: 'Meeting Room',
          isPrimary: false,
        },
        {
          url: '/img/list-5.jpg',
          alt: 'Hot Desk Area',
          isPrimary: false,
        },
      ],
      status: SpaceStatus.ACTIVE,
      rating: 4.7,
      reviewCount: 89,
      totalBookings: 892,
      metadata: {
        wifi: true,
        parking: {
          available: true,
          type: 'paid' as const,
          spaces: 50,
          instructions: 'Paid parking available in the basement',
        },
        accessibility: {
          wheelchairAccessible: true,
          elevatorAccess: true,
          accessibleParking: true,
          accessibleRestrooms: true,
        },
        petFriendly: true,
        smokingAllowed: false,
        alcoholAllowed: false,
        cateringAvailable: true,
        equipmentAvailable: [
          'Projector',
          'Whiteboard',
          'Video Conferencing',
          'Printer',
          'Scanner',
        ],
      },
    },
  ];

  // Create spaces using the created listings
  const createdSpaces: SpaceEntity[] = [];
  for (let i = 0; i < Math.min(spaceData.length, partnerListings.length); i++) {
    const listing = partnerListings[i];
    const sData = spaceData[i];

    const existingSpace = await spaceRepository.findOne({
      where: { name: sData.name, listing_id: listing.id },
    });

    const spacePayload: Partial<SpaceEntity> = {
      name: sData.name,
      description: sData.description,
      spaceType: sData.spaceType,
      listing_id: listing.id,
      totalCapacity: sData.capacity,
      commonAmenities: sData.amenities,
      space_specific_location: { floor: sData.location.floor },
      contactInfo: {
        phone: createdPartners[i]?.contactInfo?.phone,
        email: createdPartners[i]?.contactInfo?.email,
        website: createdPartners[i]?.contactInfo?.website,
      },
      operatingHours: sData.availabilityRules.operatingHours,
      spacePolicies: {
        cancellationPolicy: sData.availabilityRules.cancellationPolicy,
        advanceBookingDays: sData.availabilityRules.advanceBookingDays,
        minimumNoticeHours: sData.availabilityRules.minimumNoticeHours,
      },
      images: sData.images.map((img, idx) => ({
        url: img.url,
        alt: img.alt,
        isPrimary: !!img.isPrimary,
        category: idx === 0 ? 'lobby' : 'amenity',
      })),
      status: sData.status,
      rating: sData.rating,
      reviewCount: sData.reviewCount,
      totalBookings: sData.totalBookings,
      metadata: sData.metadata,
      totalSpaceOptions: 0,
    };

    if (!existingSpace) {
      const space = spaceRepository.create(spacePayload);
      const savedSpace = await spaceRepository.save(space);
      createdSpaces.push(savedSpace);
      console.log(
        `Created space: ${sData.name} (${savedSpace.id}) for listing: ${listing.listing_name}`,
      );
    } else {
      createdSpaces.push(existingSpace);
      console.log(
        `Space already exists: ${sData.name} for listing: ${listing.listing_name}`,
      );
    }
  }

  // Create space options for each created space
  const createdSpaceOptions: SpaceOptionEntity[] = [];
  for (const space of createdSpaces) {
    // Create one or two representative options per space
    const optionsSeed = [
      {
        name: `${space.name} - Hot Desk`,
        description: 'Open seating with access to all common amenities.',
        optionType: SpaceOptionType.HOT_DESK,
        status: SpaceOptionStatus.ACTIVE,
        maxCapacity: Math.max(
          10,
          Math.round((space.totalCapacity || 20) * 0.3),
        ),
        minCapacity: 1,
        area: 50,
        areaUnit: 'sqm',
        amenities: ['High-Speed WiFi', 'Power Outlets', 'Coffee & Tea'],
        features: ['Open Seating', 'Community Access'],
        equipment: ['Printer Access'],
        location: { floor: space.space_specific_location?.floor || 'Ground' },
        images: (space.images || []).slice(0, 2).map((img) => ({
          url: img.url,
          alt: img.alt,
          isPrimary: img.isPrimary,
        })),
        availabilityRules: {
          advanceBookingDays: space.spacePolicies?.advanceBookingDays || 30,
          minimumNoticeHours: space.spacePolicies?.minimumNoticeHours || 1,
          operatingHours: space.operatingHours,
        },
        cancellationPolicy: space.spacePolicies?.cancellationPolicy || {
          freeUntilHours: 24,
          partialRefundUntilHours: 2,
          refundPercentage: 50,
          noRefundAfterHours: 1,
        },
        isActive: true,
        priority: 1,
        rating: space.rating,
        reviewCount: space.reviewCount,
        totalBookings: Math.round((space.totalBookings || 0) * 0.6),
        metadata: {},
      },
      {
        name: `${space.name} - Meeting Room`,
        description: 'Private meeting room with projector and whiteboard.',
        optionType: SpaceOptionType.MEETING_ROOM,
        status: SpaceOptionStatus.ACTIVE,
        maxCapacity: 8,
        minCapacity: 2,
        area: 20,
        areaUnit: 'sqm',
        amenities: ['Projector', 'Whiteboard', 'Conference Phone'],
        features: ['Privacy', 'Soundproofing'],
        equipment: ['Projector', 'Screen', 'HDMI Cables'],
        location: {
          floor: space.space_specific_location?.floor || '1st',
          room: 'MR-101',
        },
        images: (space.images || []).slice(0, 1).map((img) => ({
          url: img.url,
          alt: img.alt,
          isPrimary: img.isPrimary,
        })),
        availabilityRules: {
          advanceBookingDays: space.spacePolicies?.advanceBookingDays || 30,
          minimumNoticeHours: space.spacePolicies?.minimumNoticeHours || 1,
          operatingHours: space.operatingHours,
        },
        cancellationPolicy: space.spacePolicies?.cancellationPolicy || {
          freeUntilHours: 24,
          partialRefundUntilHours: 2,
          refundPercentage: 50,
          noRefundAfterHours: 1,
        },
        isActive: true,
        priority: 2,
        rating: space.rating,
        reviewCount: space.reviewCount,
        totalBookings: Math.round((space.totalBookings || 0) * 0.3),
        metadata: {},
      },
    ];

    for (const opt of optionsSeed) {
      const existingOpt = await spaceOptionRepository.findOne({
        where: { name: opt.name, spaceId: space.id },
      });
      if (!existingOpt) {
        const spaceOption = spaceOptionRepository.create({
          spaceId: space.id,
          name: opt.name,
          description: opt.description,
          optionType: opt.optionType,
          status: opt.status,
          maxCapacity: opt.maxCapacity,
          minCapacity: opt.minCapacity,
          area: opt.area,
          areaUnit: opt.areaUnit,
          amenities: opt.amenities,
          features: opt.features,
          equipment: opt.equipment,
          location: opt.location,
          images: opt.images,
          availabilityRules: opt.availabilityRules as any,
          cancellationPolicy: opt.cancellationPolicy as any,
          isActive: opt.isActive,
          priority: opt.priority,
          rating: opt.rating,
          reviewCount: opt.reviewCount,
          totalBookings: opt.totalBookings,
          metadata: opt.metadata,
        });
        const savedOpt = await spaceOptionRepository.save(spaceOption);
        createdSpaceOptions.push(savedOpt);
        console.log(`Created space option: ${opt.name} (${savedOpt.id})`);
      } else {
        createdSpaceOptions.push(existingOpt);
        console.log(`Space option already exists: ${opt.name}`);
      }
    }
  }

  // Create bookings linked to users and space options
  const now = new Date();
  const addHours = (d: Date, h: number) =>
    new Date(d.getTime() + h * 3600 * 1000);
  const addDays = (d: Date, days: number) =>
    new Date(d.getTime() + days * 24 * 3600 * 1000);

  const bookingsSeed = [
    {
      user: createdUsers[0],
      option: createdSpaceOptions[0],
      status: BookingStatus.CONFIRMED,
      start: addHours(now, 24),
      end: addHours(now, 26),
      guestCount: 1,
      baseAmount: 300,
      extrasAmount: 50,
      discountAmount: 0,
      taxAmount: 63,
      totalAmount: 413,
      currency: 'INR',
      contactInfo: {
        name: 'Rajesh Kumar',
        email: 'owner@thirdwavecoffee.com',
        phone: '+91-9876543210',
      },
      pricing: {
        pricePerHour: 150,
        breakdown: {
          base: 300,
          extras: 50,
          taxes: 63,
          discounts: 0,
          total: 413,
        },
      },
    },
    {
      user: createdUsers[1],
      option: createdSpaceOptions[1],
      status: BookingStatus.PENDING,
      start: addDays(now, 2),
      end: addHours(addDays(now, 2), 2),
      guestCount: 4,
      baseAmount: 1600,
      extrasAmount: 0,
      discountAmount: 100,
      taxAmount: 270,
      totalAmount: 1770,
      currency: 'INR',
      contactInfo: {
        name: 'Priya Sharma',
        email: 'admin@wework.com',
        phone: '+91-9876543211',
      },
      pricing: {
        pricePerHour: 800,
        breakdown: {
          base: 1600,
          extras: 0,
          taxes: 270,
          discounts: 100,
          total: 1770,
        },
      },
    },
    {
      user: createdUsers[2],
      option: createdSpaceOptions[0],
      status: BookingStatus.CANCELLED,
      start: addDays(now, -1),
      end: addDays(now, -1),
      guestCount: 2,
      baseAmount: 300,
      extrasAmount: 0,
      discountAmount: 0,
      taxAmount: 54,
      totalAmount: 354,
      currency: 'INR',
      contactInfo: {
        name: 'Amit Patel',
        email: 'manager@starbucks.com',
        phone: '+91-9876543212',
      },
      pricing: {
        pricePerHour: 150,
        breakdown: {
          base: 300,
          extras: 0,
          taxes: 54,
          discounts: 0,
          total: 354,
        },
      },
    },
  ];

  for (const [idx, b] of bookingsSeed.entries()) {
    if (!b.user || !b.option) continue;
    const bookingNumber = `BK-${String(idx + 1).padStart(5, '0')}`;
    const bookingReference = `REF-${Date.now()}-${idx + 1}`;

    const existing = await bookingRepository.findOne({
      where: { bookingNumber },
    });
    if (existing) {
      console.log(`Booking already exists: ${bookingNumber}`);
      continue;
    }

    const booking = bookingRepository.create({
      userId: b.user.id,
      spaceOptionId: b.option.id,
      bookingNumber,
      bookingReference,
      startDateTime: b.start,
      endDateTime: b.end,
      duration: Math.round((b.end.getTime() - b.start.getTime()) / (60 * 1000)),
      guestCount: b.guestCount,
      baseAmount: b.baseAmount,
      extrasAmount: b.extrasAmount,
      discountAmount: b.discountAmount,
      taxAmount: b.taxAmount,
      totalAmount: b.totalAmount,
      currency: b.currency,
      status: b.status,
      contactInfo: b.contactInfo as any,
      pricing: b.pricing as any,
      metadata: { source: 'admin_seed' },
      confirmedAt: b.status === BookingStatus.CONFIRMED ? new Date() : null,
      cancelledAt: b.status === BookingStatus.CANCELLED ? new Date() : null,
    });
    const savedBooking = await bookingRepository.save(booking);
    console.log(`Created booking: ${bookingNumber} (${savedBooking.id})`);

    // Create a sample booking item
    const item = bookingItemRepository.create({
      bookingId: savedBooking.id,
      type: BookingItemType.EXTRAS,
      category: ExtrasCategory.FOOD_BEVERAGES as any,
      name: 'Coffee Voucher',
      description: 'Complimentary coffee vouchers',
      quantity: 2,
      unitPrice: 25,
      totalPrice: 50,
      currency: 'INR',
      specifications: {},
      metadata: { providerName: 'In-house' },
    });
    await bookingItemRepository.save(item);
    console.log(`   Added booking item: ${item.name}`);
  }

  console.log('Database seeding completed successfully!');
}

export enum PartnerType {
  SPACE = 'space',
  SERVICE = 'service',
  EVENT = 'event',
}

export enum SpaceSubtype {
  CAFE = 'cafe',
  COWORKING_SPACE = 'coworking_space',
  OFFICE_SPACE = 'office_space',
  RESTOBAR = 'restobar',
  EVENT_SPACE = 'event_space',
}

export enum ServiceSubtype {
  FREELANCER = 'freelancer',
  STARTUP_ENABLER = 'startup_enabler',
}

export enum EventSubtype {
  CONFERENCE = 'conference',
  WORKSHOP = 'workshop',
  SEMINAR = 'seminar',
  NETWORKING = 'networking',
  EXHIBITION = 'exhibition',
}

// New enums for unified architecture
export enum ListingType {
  // Space subtypes
  CAFE = SpaceSubtype.CAFE,
  COWORKING_SPACE = SpaceSubtype.COWORKING_SPACE,
  OFFICE_SPACE = SpaceSubtype.OFFICE_SPACE,
  RESTOBAR = SpaceSubtype.RESTOBAR,
  EVENT_SPACE = SpaceSubtype.EVENT_SPACE,

  // Service subtypes
  FREELANCER = ServiceSubtype.FREELANCER,
  STARTUP_ENABLER = ServiceSubtype.STARTUP_ENABLER,

  // Event subtypes
  CONFERENCE = EventSubtype.CONFERENCE,
  WORKSHOP = EventSubtype.WORKSHOP,
  SEMINAR = EventSubtype.SEMINAR,
  NETWORKING = EventSubtype.NETWORKING,
  EXHIBITION = EventSubtype.EXHIBITION,
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  UNDER_REVIEW = 'under_review',
}

export enum LaunchStatus {
  LAUNCHED = 'launched',
  COMING_SOON = 'coming_soon',
  BETA = 'beta',
  PLANNING = 'planning',
}

export enum TierClassification {
  TIER_1 = 'tier_1',
  TIER_2 = 'tier_2',
  TIER_3 = 'tier_3',
  METRO = 'metro',
  NON_METRO = 'non_metro',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum PartnerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DRAFT = 'draft',
}

import { SpaceCategory, CommissionSettings } from '@/types/space-categories';

export const mockSpaceCategories: SpaceCategory[] = [
  {
    id: '1',
    name: 'Cafe',
    slug: 'cafe',
    description: 'Coffee shops and casual dining spaces optimized for work',
    icon: 'Coffee',
    color: '#8B5CF6',
    sortOrder: 1,
    defaultCommissionRate: 15.00,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Restobar',
    slug: 'restobar',
    description: 'Restaurant-bar combinations with work-friendly environments',
    icon: 'Utensils',
    color: '#EF4444',
    sortOrder: 2,
    defaultCommissionRate: 15.00,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Coworking Space',
    slug: 'coworking-space',
    description: 'Dedicated shared workspace environments',
    icon: 'Building2',
    color: '#10B981',
    sortOrder: 3,
    defaultCommissionRate: 12.00,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'Office Space',
    slug: 'office-space',
    description: 'Private office spaces for teams and businesses',
    icon: 'Laptop',
    color: '#3B82F6',
    sortOrder: 4,
    defaultCommissionRate: 10.00,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    name: 'Event Space',
    slug: 'event-space',
    description: 'Venues for meetings, events, and gatherings',
    icon: 'Calendar',
    color: '#F59E0B',
    sortOrder: 5,
    defaultCommissionRate: 18.00,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

export const mockCommissionSettings: CommissionSettings = {
  defaultRate: 12.0,
  categoryOverrides: [
    {
      id: '1',
      categoryId: '1',
      categoryName: 'Cafe',
      commissionRate: 15.0,
      isOverride: true
    },
    {
      id: '2',
      categoryId: '2',
      categoryName: 'Restobar',
      commissionRate: 15.0,
      isOverride: true
    },
    {
      id: '5',
      categoryId: '5',
      categoryName: 'Event Space',
      commissionRate: 18.0,
      isOverride: true
    }
  ]
};
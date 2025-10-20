export interface SpaceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  sortOrder: number;
  defaultCommissionRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionSetting {
  id: string;
  categoryId: string;
  categoryName: string;
  commissionRate: number;
  isOverride: boolean;
}

export interface CommissionSettings {
  defaultRate: number;
  categoryOverrides: CommissionSetting[];
}

export interface SpaceCategoryFormData {
  name: string;
  description: string;
  icon: string;
  color: string;
  defaultCommissionRate: number;
  isActive: boolean;
}
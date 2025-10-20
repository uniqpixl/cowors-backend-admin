export interface PartnerType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  categoryCount?: number;
  partnerCount?: number;
  pricingRules?: Record<string, unknown>;
  featureRules?: Record<string, unknown>;
  validationRules?: Record<string, unknown>;
}

export interface PartnerTypeFormData {
  name: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
}

export interface PartnerTypeQueryParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'order';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PartnerTypeListResponse {
  data: PartnerType[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PartnerTypeStats {
  id: string;
  name: string;
  categoriesCount: number;
  activePartnersCount: number;
  totalPartnersCount: number;
  offeringsCount: number;
  totalRevenue: number;
  isActive: boolean;
  createdAt: Date;
}

export interface PartnerTypeAnalytics {
  stats: PartnerTypeStats[];
  totalTypes: number;
  activeTypes: number;
  totalPartners: number;
  totalRevenue: number;
}

export interface BulkPartnerTypeAction {
  ids: string[];
  action: 'activate' | 'deactivate' | 'delete';
}

export interface ReorderPartnerTypes {
  orderedIds: string[];
}
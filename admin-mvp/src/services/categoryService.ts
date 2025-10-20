import { API_BASE_URL } from '@/config/api';

// TypeScript interfaces
export interface PricingRule {
  id: string;
  name: string;
  type: string;
  value: number | string;
  conditions?: Record<string, unknown>;
}

export interface FeatureRule {
  id: string;
  name: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface ValidationRule {
  id: string;
  field: string;
  type: string;
  value: unknown;
  message: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  partnerType: string;
  isActive: boolean;
  subcategoriesCount: number;
  ruleTemplates: {
    pricingRules?: PricingRule[];
    featureRules?: FeatureRule[];
    validationRules?: ValidationRule[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  isActive: boolean;
  ruleTemplates: {
    pricingRules?: PricingRule[];
    featureRules?: FeatureRule[];
    validationRules?: ValidationRule[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
  partnerType: string;
  isActive: boolean;
  ruleTemplates?: {
    pricingRules?: PricingRule[];
    featureRules?: FeatureRule[];
    validationRules?: ValidationRule[];
  };
}

export interface CreateSubcategoryRequest {
  name: string;
  description: string;
  categoryId: string;
  isActive: boolean;
  ruleOverrides?: {
    pricingRules?: PricingRule[];
    featureRules?: FeatureRule[];
    validationRules?: ValidationRule[];
  };
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  id: string;
}

export interface UpdateSubcategoryRequest extends Partial<CreateSubcategoryRequest> {
  id: string;
}

class CategoryService {
  private baseUrl = `${API_BASE_URL}/api/v1/admin/partner-categories`;

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Category methods
  async getCategories(params?: {
    search?: string;
    partnerType?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ categories: Category[]; total: number; page: number; limit: number }> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.partnerType) searchParams.append('partnerType', params.partnerType);
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const url = `${this.baseUrl}?${searchParams.toString()}`;
    return this.makeRequest<{ categories: Category[]; total: number; page: number; limit: number }>(url);
  }

  async getCategoryById(id: string): Promise<Category> {
    return this.makeRequest<Category>(`${this.baseUrl}/${id}`);
  }

  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    return this.makeRequest<Category>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(data: UpdateCategoryRequest): Promise<Category> {
    return this.makeRequest<Category>(`${this.baseUrl}/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string): Promise<void> {
    return this.makeRequest<void>(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
  }

  // Subcategory methods
  async getSubcategories(params?: {
    search?: string;
    categoryId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ subcategories: Subcategory[]; total: number; page: number; limit: number }> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.categoryId) searchParams.append('categoryId', params.categoryId);
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const url = `${this.baseUrl}/subcategories?${searchParams.toString()}`;
    return this.makeRequest<{ subcategories: Subcategory[]; total: number; page: number; limit: number }>(url);
  }

  async getSubcategoryById(id: string): Promise<Subcategory> {
    return this.makeRequest<Subcategory>(`${this.baseUrl}/subcategories/${id}`);
  }

  async createSubcategory(data: CreateSubcategoryRequest): Promise<Subcategory> {
    return this.makeRequest<Subcategory>(`${this.baseUrl}/subcategories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSubcategory(data: UpdateSubcategoryRequest): Promise<Subcategory> {
    return this.makeRequest<Subcategory>(`${this.baseUrl}/subcategories/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSubcategory(id: string): Promise<void> {
    return this.makeRequest<void>(`${this.baseUrl}/subcategories/${id}`, {
      method: 'DELETE',
    });
  }

  // Category hierarchy
  async getCategoryHierarchy(): Promise<{ categories: Category[]; subcategories: Subcategory[] }> {
    return this.makeRequest<{ categories: Category[]; subcategories: Subcategory[] }>(`${this.baseUrl}/hierarchy`);
  }
}

export const categoryService = new CategoryService();
export default categoryService;
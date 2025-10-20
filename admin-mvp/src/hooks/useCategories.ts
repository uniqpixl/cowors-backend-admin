import { useState, useEffect, useCallback } from 'react';
import categoryService, { Category, Subcategory, CreateCategoryRequest, CreateSubcategoryRequest, UpdateCategoryRequest, UpdateSubcategoryRequest } from '@/services/categoryService';

interface UseCategoriesReturn {
  // Data
  categories: Category[];
  subcategories: Subcategory[];
  
  // Loading states
  loading: boolean;
  categoriesLoading: boolean;
  subcategoriesLoading: boolean;
  
  // Error states
  error: string | null;
  categoriesError: string | null;
  subcategoriesError: string | null;
  
  // Pagination
  totalCategories: number;
  totalSubcategories: number;
  currentPage: number;
  
  // Actions
  fetchCategories: (params?: {
    search?: string;
    partnerType?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  
  fetchSubcategories: (params?: {
    search?: string;
    categoryId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  
  createCategory: (data: CreateCategoryRequest) => Promise<Category>;
  updateCategory: (data: UpdateCategoryRequest) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  
  createSubcategory: (data: CreateSubcategoryRequest) => Promise<Subcategory>;
  updateSubcategory: (data: UpdateSubcategoryRequest) => Promise<Subcategory>;
  deleteSubcategory: (id: string) => Promise<void>;
  
  fetchCategoryHierarchy: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useCategories(): UseCategoriesReturn {
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [subcategoriesError, setSubcategoriesError] = useState<string | null>(null);
  
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalSubcategories, setTotalSubcategories] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch categories
  const fetchCategories = useCallback(async (params?: {
    search?: string;
    partnerType?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);
      
      const response = await categoryService.getCategories(params);
      setCategories(response.categories);
      setTotalCategories(response.total);
      setCurrentPage(response.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
      setCategoriesError(errorMessage);
      setError(errorMessage);
      console.error('Error fetching categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Fetch subcategories
  const fetchSubcategories = useCallback(async (params?: {
    search?: string;
    categoryId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => {
    try {
      setSubcategoriesLoading(true);
      setSubcategoriesError(null);
      
      const response = await categoryService.getSubcategories(params);
      setSubcategories(response.subcategories);
      setTotalSubcategories(response.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subcategories';
      setSubcategoriesError(errorMessage);
      setError(errorMessage);
      console.error('Error fetching subcategories:', err);
    } finally {
      setSubcategoriesLoading(false);
    }
  }, []);

  // Create category
  const createCategory = useCallback(async (data: CreateCategoryRequest): Promise<Category> => {
    try {
      setError(null);
      const newCategory = await categoryService.createCategory(data);
      setCategories(prev => [newCategory, ...prev]);
      setTotalCategories(prev => prev + 1);
      return newCategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create category';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Update category
  const updateCategory = useCallback(async (data: UpdateCategoryRequest): Promise<Category> => {
    try {
      setError(null);
      const updatedCategory = await categoryService.updateCategory(data);
      setCategories(prev => prev.map(cat => cat.id === data.id ? updatedCategory : cat));
      return updatedCategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update category';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Delete category
  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await categoryService.deleteCategory(id);
      setCategories(prev => prev.filter(cat => cat.id !== id));
      setTotalCategories(prev => prev - 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Create subcategory
  const createSubcategory = useCallback(async (data: CreateSubcategoryRequest): Promise<Subcategory> => {
    try {
      setError(null);
      const newSubcategory = await categoryService.createSubcategory(data);
      setSubcategories(prev => [newSubcategory, ...prev]);
      setTotalSubcategories(prev => prev + 1);
      
      // Update parent category's subcategory count
      setCategories(prev => prev.map(cat => 
        cat.id === data.categoryId 
          ? { ...cat, subcategoriesCount: cat.subcategoriesCount + 1 }
          : cat
      ));
      
      return newSubcategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create subcategory';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Update subcategory
  const updateSubcategory = useCallback(async (data: UpdateSubcategoryRequest): Promise<Subcategory> => {
    try {
      setError(null);
      const updatedSubcategory = await categoryService.updateSubcategory(data);
      setSubcategories(prev => prev.map(sub => sub.id === data.id ? updatedSubcategory : sub));
      return updatedSubcategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update subcategory';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Delete subcategory
  const deleteSubcategory = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      const subcategoryToDelete = subcategories.find(sub => sub.id === id);
      await categoryService.deleteSubcategory(id);
      setSubcategories(prev => prev.filter(sub => sub.id !== id));
      setTotalSubcategories(prev => prev - 1);
      
      // Update parent category's subcategory count
      if (subcategoryToDelete) {
        setCategories(prev => prev.map(cat => 
          cat.id === subcategoryToDelete.categoryId 
            ? { ...cat, subcategoriesCount: Math.max(0, cat.subcategoriesCount - 1) }
            : cat
        ));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete subcategory';
      setError(errorMessage);
      throw err;
    }
  }, [subcategories]);

  // Fetch category hierarchy
  const fetchCategoryHierarchy = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await categoryService.getCategoryHierarchy();
      setCategories(response.categories);
      setSubcategories(response.subcategories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch category hierarchy';
      setError(errorMessage);
      console.error('Error fetching category hierarchy:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch all data
  const refetch = useCallback(async () => {
    await Promise.all([
      fetchCategories(),
      fetchSubcategories()
    ]);
  }, [fetchCategories, fetchSubcategories]);

  // Initial load
  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, [fetchCategories, fetchSubcategories]);

  return {
    // Data
    categories,
    subcategories,
    
    // Loading states
    loading: loading || categoriesLoading || subcategoriesLoading,
    categoriesLoading,
    subcategoriesLoading,
    
    // Error states
    error,
    categoriesError,
    subcategoriesError,
    
    // Pagination
    totalCategories,
    totalSubcategories,
    currentPage,
    
    // Actions
    fetchCategories,
    fetchSubcategories,
    createCategory,
    updateCategory,
    deleteCategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    fetchCategoryHierarchy,
    refetch,
  };
}

export default useCategories;
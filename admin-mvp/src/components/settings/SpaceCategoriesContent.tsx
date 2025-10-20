"use client";

import React, { useState } from 'react';
import Button from '@/components/ui/button/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Coffee, Utensils, Building2, Laptop, Calendar } from 'lucide-react';
import { SpaceCategory, SpaceCategoryFormData } from '@/types/space-categories';
import { 
  useSpaceCategories, 
  useCreateSpaceCategory, 
  useUpdateSpaceCategory, 
  useDeleteSpaceCategory, 
  useToggleSpaceCategoryStatus 
} from '@/lib/api/hooks/useSpaceCategories';
import { toast } from 'sonner';

const iconMap = {
  Coffee,
  Utensils,
  Building2,
  Laptop,
  Calendar
};

const iconOptions = [
  { value: 'Coffee', label: 'Coffee' },
  { value: 'Utensils', label: 'Utensils' },
  { value: 'Building2', label: 'Building2' },
  { value: 'Laptop', label: 'Laptop' },
  { value: 'Calendar', label: 'Calendar' }
];

const colorOptions = [
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EF4444', label: 'Red' },
  { value: '#10B981', label: 'Green' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#F59E0B', label: 'Orange' },
  { value: '#d4203d', label: 'Cowors Red' }
];

export default function SpaceCategoriesContent() {
  const { data: categories = [], isLoading, error } = useSpaceCategories();
  const createMutation = useCreateSpaceCategory();
  const updateMutation = useUpdateSpaceCategory();
  const deleteMutation = useDeleteSpaceCategory();
  const toggleStatusMutation = useToggleSpaceCategoryStatus();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SpaceCategory | null>(null);
  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
  const [isEditIconDropdownOpen, setIsEditIconDropdownOpen] = useState(false);
  const [isEditColorDropdownOpen, setIsEditColorDropdownOpen] = useState(false);
  const [formData, setFormData] = useState<SpaceCategoryFormData>({
    name: '',
    description: '',
    icon: 'Coffee',
    color: '#d4203d',
    defaultCommissionRate: 12.0,
    isActive: true
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'Coffee',
      color: '#d4203d',
      defaultCommissionRate: 12.0,
      isActive: true
    });
  };

  const handleAdd = async () => {
    try {
      await createMutation.mutateAsync(formData);
      setIsAddModalOpen(false);
      resetForm();
      toast.success('Space category added successfully');
    } catch (error) {
      toast.error('Failed to add space category');
    }
  };

  const handleEdit = async () => {
    if (!selectedCategory) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedCategory.id,
        data: formData
      });
      setIsEditModalOpen(false);
      setSelectedCategory(null);
      resetForm();
      toast.success('Space category updated successfully');
    } catch (error) {
      toast.error('Failed to update space category');
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      await deleteMutation.mutateAsync(selectedCategory.id);
      setIsDeleteModalOpen(false);
      setSelectedCategory(null);
      toast.success('Space category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete space category');
    }
  };

  const handleToggleStatus = async (categoryId: string) => {
    try {
      await toggleStatusMutation.mutateAsync(categoryId);
      toast.success('Category status updated');
    } catch (error) {
      toast.error('Failed to update category status');
    }
  };

  const openEditModal = (category: SpaceCategory) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      defaultCommissionRate: category.defaultCommissionRate,
      isActive: category.isActive
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (category: SpaceCategory) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap];
    const iconClass = className || "text-[#d4203d]";
    return IconComponent ? <IconComponent className={iconClass} /> : <Coffee className={iconClass} />;
  };

  const getSelectedIconLabel = (iconValue: string) => {
    const option = iconOptions.find(opt => opt.value === iconValue);
    return option ? option.label : 'Coffee';
  };

  const getSelectedColorLabel = (colorValue: string) => {
    const option = colorOptions.find(opt => opt.value === colorValue);
    return option ? option.label : 'Cowors Red';
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Space Categories</h2>
            <p className="text-muted-foreground">
              Manage space partner types and their commission settings
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load space categories. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Space Categories</h2>
          <p className="text-muted-foreground">
            Manage space partner types and their commission settings
          </p>
        </div>
        <Button 
          className="bg-[#d4203d] hover:bg-[#b91c3a] text-white"
          onClick={() => setIsAddModalOpen(true)}
          disabled={isLoading}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div>
                      <Skeleton className="h-5 w-24 mb-2" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-20 mt-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(categories || []).map((category) => (
          <Card key={category.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-2 rounded-lg bg-[#d4203d]/10"
                  >
                    {renderIcon(category.icon, "h-5 w-5 text-[#d4203d]")}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <div className="mt-1">
                      <Badge variant={category.isActive ? "solid" : "light"} color={category.isActive ? "success" : "light"}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteModal(category)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {category.description}
              </CardDescription>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Commission Rate:</span>
                  <span className="font-medium">{category.defaultCommissionRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sort Order:</span>
                  <span className="font-medium">{category.sortOrder}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(category.id)}
                    className={`px-3 py-1 text-xs rounded-full ${
                      category.isActive 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {/* Add Category Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddModalOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Space Category</DialogTitle>
            <DialogDescription>
              Create a new space category with commission settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Category name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Category description"
                rows={3}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Icon</Label>
              <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {renderIcon(formData.icon, "h-4 w-4")}
                      {getSelectedIconLabel(formData.icon)}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {renderIcon(option.value, "h-4 w-4")}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Color</Label>
              <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: formData.color }} />
                      {getSelectedColorLabel(formData.color)}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: option.value }} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Commission Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.defaultCommissionRate}
                onChange={(e) => setFormData({ ...formData, defaultCommissionRate: parseFloat(e.target.value) || 0 })}
                placeholder="12.0"
                className="mt-1"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Active Status</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddModalOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAdd}
              className="bg-[#d4203d] hover:bg-[#b91c3a] text-white"
            >
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsEditModalOpen(false);
          setSelectedCategory(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Space Category</DialogTitle>
            <DialogDescription>
              Update the space category details and commission settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Category name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Category description"
                rows={3}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Icon</Label>
              <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {renderIcon(formData.icon, "h-4 w-4")}
                      {getSelectedIconLabel(formData.icon)}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {renderIcon(option.value, "h-4 w-4")}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Color</Label>
              <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: formData.color }} />
                      {getSelectedColorLabel(formData.color)}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: option.value }} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Commission Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.defaultCommissionRate}
                onChange={(e) => setFormData({ ...formData, defaultCommissionRate: parseFloat(e.target.value) || 0 })}
                placeholder="12.0"
                className="mt-1"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Active Status</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditModalOpen(false);
              setSelectedCategory(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleEdit}
              className="bg-[#d4203d] hover:bg-[#b91c3a] text-white"
            >
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsDeleteModalOpen(false);
          setSelectedCategory(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Space Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCategory?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteModalOpen(false);
              setSelectedCategory(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
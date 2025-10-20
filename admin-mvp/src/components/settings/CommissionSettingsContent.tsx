"use client";

import React, { useState } from 'react';
import Button from '@/components/ui/button/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Label from '@/components/form/Label';
import Badge from '@/components/ui/badge/Badge';
import { Modal } from '@/components/ui';
import { Dropdown, DropdownItem } from '@/components/ui';
import { Coffee, Utensils, Building2, Laptop, Calendar, Plus, Edit, Trash2, Save, X, Loader2 } from 'lucide-react';
import { CommissionSettings, CommissionSetting, SpaceCategory } from '@/types/space-categories';
import { useCommissionSettings, useUpdateCommissionSettings } from '@/hooks/useCommissionSettings';
import { useSpaceCategories } from '@/lib/api/hooks/useSpaceCategories';
import { toast } from 'sonner';

const iconMap = {
  Coffee,
  Utensils,
  Building2,
  Laptop,
  Calendar
};

export default function CommissionSettingsContent() {
  const { data: commissionData, isLoading: commissionLoading } = useCommissionSettings();
  const { data: spaceCategories = [], isLoading: categoriesLoading } = useSpaceCategories();
  const updateCommissionSettings = useUpdateCommissionSettings();
  
  const [defaultRate, setDefaultRate] = useState(commissionData?.defaultRate || 15);
  const [isAddOverrideOpen, setIsAddOverrideOpen] = useState(false);
  const [isEditOverrideOpen, setIsEditOverrideOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [selectedOverride, setSelectedOverride] = useState<CommissionSetting | null>(null);
  const [newOverride, setNewOverride] = useState({ categoryId: '', commissionRate: 0 });

  const settings = commissionData || { defaultRate: 15, categoryOverrides: [] };
  
  const availableCategories = spaceCategories.filter(
    cat => !settings.categoryOverrides.some((override: CommissionSetting) => override.categoryId === cat.id)
  );
  
  // Update defaultRate when commissionData changes
  React.useEffect(() => {
    if (commissionData?.defaultRate) {
      setDefaultRate(commissionData.defaultRate);
    }
  }, [commissionData]);
  
  if (commissionLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap];
    const iconClass = className || "text-[#d4203d]";
    return IconComponent ? <IconComponent className={iconClass} /> : <Coffee className={iconClass} />;
  };

  const handleSaveDefaultRate = () => {
    const updatedSettings = { ...settings, defaultRate };
    updateCommissionSettings.mutate(updatedSettings);
  };

  const handleAddOverride = () => {
    const category = spaceCategories.find(cat => cat.id === newOverride.categoryId);
    if (!category) return;

    const override: CommissionSetting = {
      id: Date.now().toString(),
      categoryId: category.id,
      categoryName: category.name,
      commissionRate: newOverride.commissionRate,
      isOverride: true
    };

    const updatedSettings = {
      ...settings,
      categoryOverrides: [...settings.categoryOverrides, override]
    };

    updateCommissionSettings.mutate(updatedSettings);
    setNewOverride({ categoryId: '', commissionRate: 0 });
    setIsAddOverrideOpen(false);
  };

  const handleEditOverride = () => {
    if (!selectedOverride) return;

    const updatedOverrides = settings.categoryOverrides.map((override: CommissionSetting) =>
      override.id === selectedOverride.id
        ? { ...override, commissionRate: newOverride.commissionRate }
        : override
    );

    const updatedSettings = { ...settings, categoryOverrides: updatedOverrides };
    updateCommissionSettings.mutate(updatedSettings);
    setIsEditOverrideOpen(false);
    setSelectedOverride(null);
    setNewOverride({ categoryId: '', commissionRate: 0 });
  };

  const handleDeleteOverride = (overrideId: string) => {
    const updatedOverrides = settings.categoryOverrides.filter((override: CommissionSetting) => override.id !== overrideId);
    const updatedSettings = { ...settings, categoryOverrides: updatedOverrides };
    updateCommissionSettings.mutate(updatedSettings);
  };

  const openEditDialog = (override: CommissionSetting) => {
    setSelectedOverride(override);
    setNewOverride({ categoryId: override.categoryId, commissionRate: override.commissionRate });
    setIsEditOverrideOpen(true);
  };

  const getCategoryDetails = (categoryId: string) => {
    return spaceCategories.find(cat => cat.id === categoryId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Commission Settings</h2>
        <p className="text-muted-foreground">
          Configure default commission rates and category-specific overrides
        </p>
      </div>

      {/* Default Commission Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Default Commission Rate</CardTitle>
          <CardDescription>
            The standard commission rate applied to all space categories unless overridden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="default-rate">Commission Rate (%)</Label>
              <Input
                id="default-rate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={defaultRate}
                onChange={(e) => setDefaultRate(parseFloat(e.target.value) || 0)}
                className="mt-1"
                placeholder="12.0"
              />
            </div>
            <Button 
              onClick={handleSaveDefaultRate}
              className="bg-[#d4203d] hover:bg-[#b91c3a] text-white mt-6"
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Overrides */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Category Overrides</CardTitle>
              <CardDescription>
                Set specific commission rates for individual space categories
              </CardDescription>
            </div>
            <Button 
              className="bg-[#d4203d] hover:bg-[#b91c3a] text-white"
              disabled={availableCategories.length === 0}
              onClick={() => setIsAddOverrideOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Override
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {settings.categoryOverrides.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No commission overrides configured.</p>
              <p className="text-sm">All categories will use the default rate of {settings.defaultRate}%</p>
            </div>
          ) : (
            <div className="space-y-4">
              {settings.categoryOverrides.map((override: CommissionSetting) => {
                const category = getCategoryDetails(override.categoryId);
                return (
                  <div key={override.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {category && (
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          {renderIcon(category.icon, "h-5 w-5")}
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium">{override.categoryName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Custom rate: {override.commissionRate}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="light" color="primary">
                        {override.commissionRate}%
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(override)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteOverride(override.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Summary</CardTitle>
          <CardDescription>
            Overview of commission rates for all categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {spaceCategories.map((category) => {
              const override = settings.categoryOverrides.find((o: CommissionSetting) => o.categoryId === category.id);
              const rate = override ? override.commissionRate : settings.defaultRate;
              const isOverridden = !!override;
              
              return (
                <div key={category.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg bg-[#d4203d]/10"
                    >
                      {renderIcon(category.icon, "h-4 w-4 text-[#d4203d]")}
                    </div>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isOverridden ? "solid" : "light"} color={isOverridden ? "primary" : "light"}>
                      {rate}%
                    </Badge>
                    {isOverridden && (
                      <Badge variant="light" color="error">
                        Override
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Override Modal */}
      <Modal
        isOpen={isAddOverrideOpen}
        onClose={() => setIsAddOverrideOpen(false)}
        className="max-w-md"
      >
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Commission Override</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Set a custom commission rate for a specific category.</p>
          </div>
          <div className="space-y-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <div className="relative">
              <Button
                variant="outline"
                className="w-full justify-between dropdown-toggle"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              >
                {newOverride.categoryId ? 
                  availableCategories.find(cat => cat.id === newOverride.categoryId)?.name || "Select category" :
                  "Select category"
                }
              </Button>
              <Dropdown
                isOpen={isCategoryDropdownOpen}
                onClose={() => setIsCategoryDropdownOpen(false)}
              >
                {availableCategories.map((category) => (
                  <DropdownItem
                    key={category.id}
                    onClick={() => {
                      setNewOverride({ ...newOverride, categoryId: category.id });
                      setIsCategoryDropdownOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {renderIcon(category.icon, "h-4 w-4 text-[#d4203d]")}
                      {category.name}
                    </div>
                  </DropdownItem>
                ))}
              </Dropdown>
            </div>
          </div>
          <div>
            <Label htmlFor="rate">Rate (%)</Label>
            <Input
              id="rate"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={newOverride.commissionRate}
              onChange={(e) => setNewOverride({ ...newOverride, commissionRate: parseFloat(e.target.value) || 0 })}
              placeholder="15.0"
            />
          </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsAddOverrideOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddOverride}
              className="bg-[#d4203d] hover:bg-[#b91c3a] text-white"
              disabled={!newOverride.categoryId || newOverride.commissionRate <= 0}
            >
              Add Override
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Override Modal */}
      <Modal
        isOpen={isEditOverrideOpen}
        onClose={() => setIsEditOverrideOpen(false)}
        className="max-w-md"
      >
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Commission Override</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Update the commission rate for this category.</p>
          </div>
          <div className="space-y-4">
          <div>
            <Label>Category</Label>
            <div className="p-3 bg-gray-50 rounded-md">
              {selectedOverride && (
                <div className="flex items-center gap-2">
                  {(() => {
                    const category = getCategoryDetails(selectedOverride.categoryId);
                    return category ? renderIcon(category.icon, "h-4 w-4 text-[#d4203d]") : null;
                  })()}
                  {selectedOverride.categoryName}
                </div>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="edit-rate">Rate (%)</Label>
            <Input
              id="edit-rate"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={newOverride.commissionRate}
              onChange={(e) => setNewOverride({ ...newOverride, commissionRate: parseFloat(e.target.value) || 0 })}
              placeholder="15.0"
            />
          </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditOverrideOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditOverride}
              className="bg-[#d4203d] hover:bg-[#b91c3a] text-white"
              disabled={newOverride.commissionRate <= 0}
            >
              Update Override
            </Button>
          </div>
        </div>
      </Modal>


    </div>
  );
}
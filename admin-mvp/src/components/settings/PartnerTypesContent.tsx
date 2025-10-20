"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TextArea from "@/components/form/input/TextArea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BsBriefcase, 
  BsShop, 
  BsHouse, 
  BsPeople, 
  BsGear,
  BsBuilding,
  BsTools,
  BsHeart
} from "react-icons/bs";
import { 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  Filter,
  MoreVertical,
  BarChart3,
  Users,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import {
  usePartnerTypes,
  usePartnerTypeAnalytics,
  useCreatePartnerType,
  useUpdatePartnerType,
  useDeletePartnerType,
  useTogglePartnerTypeStatus,
  useBulkPartnerTypeAction,
} from "@/lib/api/hooks/usePartnerTypes";
import { PartnerType, PartnerTypeFormData } from "@/types/partner-types";
import { formatDate } from '@/utils/formatters';

const iconMap = {
  briefcase: BsBriefcase,
  shop: BsShop,
  house: BsHouse,
  people: BsPeople,
  gear: BsGear,
  building: BsBuilding,
  tools: BsTools,
  heart: BsHeart,
};

export default function PartnerTypesContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [editingPartnerType, setEditingPartnerType] = useState<PartnerType | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [formData, setFormData] = useState<PartnerTypeFormData>({
    name: "",
    description: "",
    icon: "briefcase",
    color: "#6366f1",
    isActive: true,
  });

  // API hooks
  const { data: partnerTypesResponse, isLoading, error, refetch } = usePartnerTypes({
    search: searchTerm || undefined,
    isActive: statusFilter,
    page: 1,
    limit: 50,
    sortBy: 'order',
    sortOrder: 'ASC',
  });

  const { data: analytics, isLoading: analyticsLoading } = usePartnerTypeAnalytics();
  const createMutation = useCreatePartnerType();
  const updateMutation = useUpdatePartnerType();
  const deleteMutation = useDeletePartnerType();
  const toggleStatusMutation = useTogglePartnerTypeStatus();
  const bulkActionMutation = useBulkPartnerTypeAction();

  const partnerTypes = partnerTypesResponse?.data || [];

  const handleAddPartnerType = async () => {
    try {
      await createMutation.mutateAsync(formData);
      setFormData({
        name: "",
        description: "",
        icon: "briefcase",
        color: "#6366f1",
        isActive: true,
      });
      setIsAddDialogOpen(false);
      toast.success("Partner type added successfully");
    } catch (error) {
      toast.error("Failed to add partner type");
    }
  };

  const handleEditPartnerType = async () => {
    if (!editingPartnerType) return;
    
    try {
      await updateMutation.mutateAsync({
        id: editingPartnerType.id,
        data: formData,
      });
      setIsEditDialogOpen(false);
      setEditingPartnerType(null);
      setFormData({
        name: "",
        description: "",
        icon: "briefcase",
        color: "#6366f1",
        isActive: true,
      });
      toast.success("Partner type updated successfully");
    } catch (error) {
      toast.error("Failed to update partner type");
    }
  };

  const handleDeletePartnerType = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Partner type deleted successfully");
    } catch (error) {
      toast.error("Failed to delete partner type");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleStatusMutation.mutateAsync(id);
      const partnerType = partnerTypes.find((pt) => pt.id === id);
      toast.success(`Partner type ${partnerType?.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      toast.error("Failed to toggle partner type status");
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedItems.length === 0) {
      toast.error("Please select items to perform bulk action");
      return;
    }

    try {
      await bulkActionMutation.mutateAsync({
        ids: selectedItems,
        action,
      });
      setSelectedItems([]);
      toast.success(`Bulk ${action} completed successfully`);
    } catch (error) {
      toast.error(`Failed to perform bulk ${action}`);
    }
  };

  const openEditDialog = (partnerType: PartnerType) => {
    setEditingPartnerType(partnerType);
    setFormData({
      name: partnerType.name,
      description: partnerType.description || "",
      icon: partnerType.icon || "briefcase",
      color: partnerType.color || "#6366f1",
      isActive: partnerType.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === partnerTypes.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(partnerTypes.map(pt => pt.id));
    }
  };

  const PartnerTypeForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Partner Type Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter partner type name"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <TextArea
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="Enter partner type description"
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="icon">Icon</Label>
        <select
          id="icon"
          value={formData.icon}
          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="briefcase">Professional Services (Briefcase)</option>
          <option value="shop">Retail &amp; Commerce (Shop)</option>
          <option value="house">Real Estate (House)</option>
          <option value="people">Community Services (People)</option>
          <option value="gear">Technical Services (Gear)</option>
          <option value="building">Corporate (Building)</option>
          <option value="tools">Maintenance &amp; Repair (Tools)</option>
          <option value="heart">Health &amp; Wellness (Heart)</option>
        </select>
      </div>
      <div>
        <Label htmlFor="color">Color</Label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            id="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
          />
          <Input
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            placeholder="#6366f1"
            className="flex-1"
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          variant="outline"
          onClick={() => {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setFormData({
              name: "",
              description: "",
              icon: "briefcase",
              color: "#6366f1",
              isActive: true,
            });
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={isEdit ? handleEditPartnerType : handleAddPartnerType}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
          disabled={!formData.name.trim() || !formData.description.trim()}
        >
          {isEdit ? "Update" : "Add"} Partner Type
        </Button>
      </div>
    </div>
  );

  const AnalyticsDialog = () => (
    <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Partner Types Analytics</DialogTitle>
        </DialogHeader>
        {analyticsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-xs text-gray-600">Total Types</p>
                      <p className="text-xl font-bold">{analytics.totalTypes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-600">Active Types</p>
                      <p className="text-xl font-bold">{analytics.activeTypes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">Total Partners</p>
                      <p className="text-xl font-bold">{analytics.totalPartners}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-gray-600">Total Revenue</p>
                      <p className="text-xl font-bold">₹{analytics.totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Partner Type Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.stats.map((stat) => (
                  <Card key={stat.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium">{stat.name}</h4>
                          <div className="grid grid-cols-2 gap-4 mt-2 text-xs text-gray-600">
                            <div>Categories: {stat.categoriesCount}</div>
                            <div>Partners: {stat.totalPartnersCount}</div>
                            <div>Active: {stat.activePartnersCount}</div>
                            <div>Revenue: ₹{stat.totalRevenue.toLocaleString()}</div>
                          </div>
                        </div>
                        <Badge variant={stat.isActive ? "default" : "secondary"}>
                          {stat.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p>No analytics data available</p>
        )}
      </DialogContent>
    </Dialog>
  );

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load partner types</p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Partner Types
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage partner types for your platform
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsAnalyticsOpen(true)}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </Button>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Partner Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Partner Type</DialogTitle>
              </DialogHeader>
              <PartnerTypeForm />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search partner types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter === undefined ? "all" : statusFilter.toString()}
            onChange={(e) => {
              const value = e.target.value;
              setStatusFilter(value === "all" ? undefined : value === "true");
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg dark:bg-blue-900/20">
            <span className="text-xs text-blue-700 dark:text-blue-300">
              {selectedItems.length} item(s) selected
            </span>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('activate')}
              >
                Activate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('deactivate')}
              >
                Deactivate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('delete')}
                className="text-red-600 hover:text-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Partner Types Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partnerTypes.map((partnerType) => {
            const IconComponent = iconMap[partnerType.icon as keyof typeof iconMap] || BsBriefcase;
            return (
              <Card key={partnerType.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(partnerType.id)}
                        onChange={() => toggleSelectItem(partnerType.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${partnerType.color}20` }}
                      >
                        <IconComponent 
                          className="w-6 h-6" 
                          style={{ color: partnerType.color }}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                          {partnerType.name}
                        </CardTitle>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{partnerType.slug}</p>
                      </div>
                    </div>
                    <Switch
                      checked={partnerType.isActive}
                      onCheckedChange={() => handleToggleStatus(partnerType.id)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 text-xs mb-4">{partnerType.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>Categories: {partnerType.categoryCount || 0}</span>
                      <span>Partners: {partnerType.partnerCount || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={partnerType.isActive ? "default" : "secondary"}
                        className={partnerType.isActive ? "bg-green-100 text-green-800" : ""}
                      >
                        {partnerType.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {partnerType.createdAt && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Created {formatDate(partnerType.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(partnerType)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePartnerType(partnerType.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Partner Type</DialogTitle>
          </DialogHeader>
          <PartnerTypeForm isEdit />
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <AnalyticsDialog />
    </div>
  );
}
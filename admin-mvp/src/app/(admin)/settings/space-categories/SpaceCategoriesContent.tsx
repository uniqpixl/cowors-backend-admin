"use client";

import React, { useState } from "react";
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
import { BsCupHot, BsLaptop, BsBriefcase, BsCalendarEvent } from "react-icons/bs";
import { MdRestaurant } from "react-icons/md";
import { Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface SpaceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  isActive: boolean;
}

const iconMap = {
  cafe: BsCupHot,
  restobar: MdRestaurant,
  coworking: BsLaptop,
  office: BsBriefcase,
  event: BsCalendarEvent,
};

const initialCategories: SpaceCategory[] = [
  {
    id: "1",
    name: "Cafe",
    slug: "cafe",
    description: "Coffee shops and casual dining spaces optimized for work",
    icon: "cafe",
    isActive: true,
  },
  {
    id: "2",
    name: "Restobar",
    slug: "restobar",
    description: "Restaurant-bar combinations with work-friendly environments",
    icon: "restobar",
    isActive: true,
  },
  {
    id: "3",
    name: "Coworking Space",
    slug: "coworking",
    description: "Dedicated shared workspace environments",
    icon: "coworking",
    isActive: true,
  },
  {
    id: "4",
    name: "Office Space",
    slug: "office",
    description: "Private office spaces for teams and businesses",
    icon: "office",
    isActive: true,
  },
  {
    id: "5",
    name: "Event Space",
    slug: "event",
    description: "Venues for meetings, events, and gatherings",
    icon: "event",
    isActive: true,
  },
];

export default function SpaceCategoriesContent() {
  const [categories, setCategories] = useState<SpaceCategory[]>(initialCategories);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SpaceCategory | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "cafe",
  });

  const handleAddCategory = () => {
    const newCategory: SpaceCategory = {
      id: Date.now().toString(),
      name: formData.name,
      slug: formData.name.toLowerCase().replace(/\s+/g, "-"),
      description: formData.description,
      icon: formData.icon,
      isActive: true,
    };
    setCategories([...categories, newCategory]);
    setFormData({ name: "", description: "", icon: "cafe" });
    setIsAddDialogOpen(false);
    toast.success("Category added successfully");
  };

  const handleEditCategory = () => {
    if (!editingCategory) return;
    
    const updatedCategories = categories.map((cat) =>
      cat.id === editingCategory.id
        ? {
            ...cat,
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            slug: formData.name.toLowerCase().replace(/\s+/g, "-"),
          }
        : cat
    );
    setCategories(updatedCategories);
    setIsEditDialogOpen(false);
    setEditingCategory(null);
    setFormData({ name: "", description: "", icon: "cafe" });
    toast.success("Category updated successfully");
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter((cat) => cat.id !== id));
    toast.success("Category deleted successfully");
  };

  const handleToggleStatus = (id: string) => {
    const updatedCategories = categories.map((cat) =>
      cat.id === id ? { ...cat, isActive: !cat.isActive } : cat
    );
    setCategories(updatedCategories);
    const category = categories.find((cat) => cat.id === id);
    toast.success(`Category ${category?.isActive ? 'deactivated' : 'activated'} successfully`);
  };

  const openEditDialog = (category: SpaceCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
    });
    setIsEditDialogOpen(true);
  };

  const CategoryForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Category Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter category name"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <TextArea
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="Enter category description"
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="icon">Icon</Label>
        <select
          id="icon"
          value={formData.icon}
          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="cafe">Cafe (Coffee Cup)</option>
          <option value="restobar">Restobar (Restaurant)</option>
          <option value="coworking">Coworking (Laptop)</option>
          <option value="office">Office (Briefcase)</option>
          <option value="event">Event (Calendar)</option>
        </select>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          variant="outline"
          onClick={() => {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setFormData({ name: "", description: "", icon: "cafe" });
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={isEdit ? handleEditCategory : handleAddCategory}
          className="bg-red-600 hover:bg-red-700 text-white"
          disabled={!formData.name.trim() || !formData.description.trim()}
        >
          {isEdit ? "Update" : "Add"} Category
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Space Categories</h1>
          <p className="text-gray-600 mt-1">Manage space categories for your platform</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
            </DialogHeader>
            <CategoryForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const IconComponent = iconMap[category.icon as keyof typeof iconMap];
          return (
            <Card key={category.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <IconComponent className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <p className="text-sm text-gray-500">{category.slug}</p>
                    </div>
                  </div>
                  <Switch
                    checked={category.isActive}
                    onCheckedChange={() => handleToggleStatus(category.id)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      category.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {category.isActive ? "Active" : "Inactive"}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(category)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <CategoryForm isEdit />
        </DialogContent>
      </Dialog>
    </div>
  );
}
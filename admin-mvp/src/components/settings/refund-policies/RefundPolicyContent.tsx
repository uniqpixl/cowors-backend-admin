'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Star, 
  StarOff, 
  Filter,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { useRefundPolicies } from '@/hooks/useRefundPolicies';
import { RefundPolicy, RefundPolicyType, RefundCalculationType } from '@/types/refund-policies';
import RefundPolicyModal from './RefundPolicyModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function RefundPolicyContent() {
  const {
    policies,
    loading,
    error,
    createPolicy,
    updatePolicy,
    deletePolicy,
    togglePolicyStatus,
    setAsDefault,
    refreshPolicies,
  } = useRefundPolicies();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<RefundPolicy | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<RefundPolicy | null>(null);

  // Filter and search policies
  const filteredPolicies = useMemo(() => {
    return policies.filter(policy => {
      const matchesSearch = policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (policy.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesType = filterType === 'all' || policy.type === filterType;
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && policy.isActive) ||
                           (filterStatus === 'inactive' && !policy.isActive);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [policies, searchTerm, filterType, filterStatus]);

  const handleCreatePolicy = () => {
    setEditingPolicy(null);
    setIsModalOpen(true);
  };

  const handleEditPolicy = (policy: RefundPolicy) => {
    setEditingPolicy(policy);
    setIsModalOpen(true);
  };

  const handleSavePolicy = async (data: RefundPolicyFormData) => {
    try {
      setIsModalLoading(true);
      
      if (editingPolicy) {
        await updatePolicy(editingPolicy.id, data);
      } else {
        await createPolicy(data);
      }
      
      setIsModalOpen(false);
      setEditingPolicy(null);
    } catch (error) {
      console.error('Failed to save policy:', error);
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleDeletePolicy = (policy: RefundPolicy) => {
    setPolicyToDelete(policy);
    setDeleteDialogOpen(true);
  };

  const confirmDeletePolicy = async () => {
    if (policyToDelete) {
      try {
        await deletePolicy(policyToDelete.id);
        setDeleteDialogOpen(false);
        setPolicyToDelete(null);
      } catch (error) {
        console.error('Failed to delete policy:', error);
      }
    }
  };

  const handleToggleStatus = async (policy: RefundPolicy) => {
    try {
      await togglePolicyStatus(policy.id, !policy.isActive);
    } catch (error) {
      console.error('Failed to toggle policy status:', error);
    }
  };

  const handleSetDefault = async (policy: RefundPolicy) => {
    try {
      await setAsDefault(policy.id);
    } catch (error) {
      console.error('Failed to set default policy:', error);
    }
  };

  const getPolicyTypeColor = (type: RefundPolicyType) => {
    switch (type) {
      case RefundPolicyType.FLEXIBLE:
        return 'bg-green-100 text-green-800';
      case RefundPolicyType.MODERATE:
        return 'bg-yellow-100 text-yellow-800';
      case RefundPolicyType.STRICT:
        return 'bg-red-100 text-red-800';
      case RefundPolicyType.CUSTOM:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCalculationTypeIcon = (type: RefundCalculationType) => {
    switch (type) {
      case RefundCalculationType.PERCENTAGE:
        return <span className="text-sm">%</span>;
      case RefundCalculationType.FIXED_AMOUNT:
        return <DollarSign className="h-4 w-4" />;
      case RefundCalculationType.TIERED:
        return <div className="flex space-x-1">
          <div className="w-1 h-3 bg-gray-400 rounded"></div>
          <div className="w-1 h-4 bg-gray-600 rounded"></div>
          <div className="w-1 h-2 bg-gray-400 rounded"></div>
        </div>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Refund Policies</h2>
          <p className="text-gray-600">Manage refund policies for your workspace bookings</p>
        </div>
        <Button 
          onClick={handleCreatePolicy}
          className="bg-[#d4203d] hover:bg-[#b91c3a] text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Policy
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search policies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={RefundPolicyType.FLEXIBLE}>Flexible</SelectItem>
                  <SelectItem value={RefundPolicyType.MODERATE}>Moderate</SelectItem>
                  <SelectItem value={RefundPolicyType.STRICT}>Strict</SelectItem>
                  <SelectItem value={RefundPolicyType.CUSTOM}>Custom</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policies Grid */}
      <div className="grid gap-4">
        {filteredPolicies.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <Filter className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No policies found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Create your first refund policy to get started'
                  }
                </p>
                {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
                  <Button 
                    onClick={handleCreatePolicy}
                    className="bg-[#d4203d] hover:bg-[#b91c3a] text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Policy
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredPolicies.map((policy) => (
            <Card key={policy.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{policy.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {policy.isDefault && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Default
                          </Badge>
                        )}
                        <Badge className={getPolicyTypeColor(policy.type)}>
                          {policy.type}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getCalculationTypeIcon(policy.calculationType)}
                          <span className="text-xs text-gray-600 capitalize">
                            {policy.calculationType.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    {policy.description && (
                      <p className="text-gray-600 text-sm mb-3">{policy.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={policy.isActive}
                      onCheckedChange={() => handleToggleStatus(policy)}
                      className="data-[state=checked]:bg-[#d4203d]"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditPolicy(policy)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {!policy.isDefault && (
                          <DropdownMenuItem onClick={() => handleSetDefault(policy)}>
                            <Star className="mr-2 h-4 w-4" />
                            Set as Default
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeletePolicy(policy)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-gray-600">Min Notice</p>
                      <p className="font-medium">{policy.minimumNoticeHours}h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-gray-600">Processing</p>
                      <p className="font-medium">{policy.processingDays} days</p>
                    </div>
                  </div>
                  {policy.calculationType === RefundCalculationType.PERCENTAGE && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">%</span>
                      <div>
                        <p className="text-gray-600">Default Refund</p>
                        <p className="font-medium">{policy.defaultRefundPercentage}%</p>
                      </div>
                    </div>
                  )}
                  {policy.calculationType === RefundCalculationType.FIXED_AMOUNT && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Cancellation Fee</p>
                        <p className="font-medium">${policy.fixedCancellationFee}</p>
                      </div>
                    </div>
                  )}
                  {policy.calculationType === RefundCalculationType.TIERED && (
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-1 h-3 bg-gray-400 rounded"></div>
                        <div className="w-1 h-4 bg-gray-600 rounded"></div>
                        <div className="w-1 h-2 bg-gray-400 rounded"></div>
                      </div>
                      <div>
                        <p className="text-gray-600">Tiers</p>
                        <p className="font-medium">{policy.refundTiers?.length || 0} levels</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      {policy.allowSameDayRefund && (
                        <Badge variant="outline" className="text-xs">Same Day</Badge>
                      )}
                      {policy.allowPartialRefund && (
                        <Badge variant="outline" className="text-xs">Partial</Badge>
                      )}
                      {policy.requireApproval && (
                        <Badge variant="outline" className="text-xs">Approval</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      <RefundPolicyModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPolicy(null);
        }}
        onSave={handleSavePolicy}
        policy={editingPolicy}
        isLoading={isModalLoading}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Refund Policy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{policyToDelete?.name}&quot;? This action cannot be undone.
              {policyToDelete?.isDefault && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                  <strong>Warning:</strong> This is the default policy. You&apos;ll need to set another policy as default.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePolicy}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Policy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
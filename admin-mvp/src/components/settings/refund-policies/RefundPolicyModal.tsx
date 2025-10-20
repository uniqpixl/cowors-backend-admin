'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { RefundPolicy, RefundPolicyFormData, RefundPolicyType, RefundCalculationType, RefundTier } from '@/types/refund-policies';

interface RefundPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RefundPolicyFormData) => Promise<void>;
  policy?: RefundPolicy | null;
  isLoading?: boolean;
}

const POLICY_TYPES = [
  { value: RefundPolicyType.FLEXIBLE, label: 'Flexible' },
  { value: RefundPolicyType.MODERATE, label: 'Moderate' },
  { value: RefundPolicyType.STRICT, label: 'Strict' },
  { value: RefundPolicyType.CUSTOM, label: 'Custom' },
];

const CALCULATION_TYPES = [
  { value: RefundCalculationType.PERCENTAGE, label: 'Percentage' },
  { value: RefundCalculationType.FIXED_AMOUNT, label: 'Fixed Amount' },
  { value: RefundCalculationType.TIERED, label: 'Tiered' },
];

export default function RefundPolicyModal({
  isOpen,
  onClose,
  onSave,
  policy,
  isLoading = false,
}: RefundPolicyModalProps) {
  const [formData, setFormData] = useState<RefundPolicyFormData>({
    name: '',
    description: '',
    type: RefundPolicyType.FLEXIBLE,
    calculationType: RefundCalculationType.PERCENTAGE,
    isActive: true,
    isDefault: false,
    minimumNoticeHours: 24,
    noRefundHours: 2,
    defaultRefundPercentage: 100,
    fixedCancellationFee: 0,
    refundTiers: [],
    allowSameDayRefund: false,
    allowPartialRefund: true,
    requireApproval: false,
    processingDays: 3,
    applicableSpaceTypes: [],
    excludedDates: [],
    forceMajeureFullRefund: true,
    terms: '',
    metadata: {},
  });

  const [newTier, setNewTier] = useState<Partial<RefundTier>>({
    hoursBeforeBooking: 0,
    refundPercentage: 0,
    fixedFee: 0,
  });

  useEffect(() => {
    if (policy) {
      setFormData({
        name: policy.name,
        description: policy.description || '',
        type: policy.type,
        calculationType: policy.calculationType,
        isActive: policy.isActive,
        isDefault: policy.isDefault,
        minimumNoticeHours: policy.minimumNoticeHours,
        noRefundHours: policy.noRefundHours || 0,
        defaultRefundPercentage: policy.defaultRefundPercentage || 0,
        fixedCancellationFee: policy.fixedCancellationFee || 0,
        refundTiers: policy.refundTiers || [],
        allowSameDayRefund: policy.allowSameDayRefund || false,
        allowPartialRefund: policy.allowPartialRefund || false,
        requireApproval: policy.requireApproval || false,
        processingDays: policy.processingDays || 3,
        applicableSpaceTypes: policy.applicableSpaceTypes || [],
        excludedDates: policy.excludedDates || [],
        forceMajeureFullRefund: policy.forceMajeureFullRefund || false,
        terms: policy.terms || '',
        metadata: policy.metadata || {},
      });
    } else {
      // Reset form for new policy
      setFormData({
        name: '',
        description: '',
        type: RefundPolicyType.FLEXIBLE,
        calculationType: RefundCalculationType.PERCENTAGE,
        isActive: true,
        isDefault: false,
        minimumNoticeHours: 24,
        noRefundHours: 2,
        defaultRefundPercentage: 100,
        fixedCancellationFee: 0,
        refundTiers: [],
        allowSameDayRefund: false,
        allowPartialRefund: true,
        requireApproval: false,
        processingDays: 3,
        applicableSpaceTypes: [],
        excludedDates: [],
        forceMajeureFullRefund: true,
        terms: '',
        metadata: {},
      });
    }
  }, [policy, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  const addTier = () => {
    if (newTier.hoursBeforeBooking !== undefined && newTier.refundPercentage !== undefined) {
      setFormData(prev => ({
        ...prev,
        refundTiers: [...prev.refundTiers, {
          hoursBeforeBooking: newTier.hoursBeforeBooking!,
          refundPercentage: newTier.refundPercentage!,
          fixedFee: newTier.fixedFee || 0,
        }],
      }));
      setNewTier({ hoursBeforeBooking: 0, refundPercentage: 0, fixedFee: 0 });
    }
  };

  const removeTier = (index: number) => {
    setFormData(prev => ({
      ...prev,
      refundTiers: prev.refundTiers.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {policy ? 'Edit Refund Policy' : 'Create New Refund Policy'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Policy Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Standard Refund Policy"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Policy Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: RefundPolicyType) => 
                      setFormData(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POLICY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this refund policy..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="calculationType">Calculation Type *</Label>
                  <Select
                    value={formData.calculationType}
                    onValueChange={(value: RefundCalculationType) => 
                      setFormData(prev => ({ ...prev, calculationType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CALCULATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="processingDays">Processing Days</Label>
                  <Input
                    id="processingDays"
                    type="number"
                    min="1"
                    max="30"
                    value={formData.processingDays}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      processingDays: parseInt(e.target.value) || 3 
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Refund Configuration */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-semibold">Refund Configuration</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minimumNoticeHours">Minimum Notice Hours *</Label>
                  <Input
                    id="minimumNoticeHours"
                    type="number"
                    min="0"
                    value={formData.minimumNoticeHours}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      minimumNoticeHours: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="noRefundHours">No Refund Hours</Label>
                  <Input
                    id="noRefundHours"
                    type="number"
                    min="0"
                    value={formData.noRefundHours}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      noRefundHours: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
              </div>

              {formData.calculationType === RefundCalculationType.PERCENTAGE && (
                <div>
                  <Label htmlFor="defaultRefundPercentage">Default Refund Percentage (%)</Label>
                  <Input
                    id="defaultRefundPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.defaultRefundPercentage}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      defaultRefundPercentage: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
              )}

              {formData.calculationType === RefundCalculationType.FIXED_AMOUNT && (
                <div>
                  <Label htmlFor="fixedCancellationFee">Fixed Cancellation Fee</Label>
                  <Input
                    id="fixedCancellationFee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.fixedCancellationFee}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      fixedCancellationFee: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
              )}

              {/* Tiered Configuration */}
              {formData.calculationType === RefundCalculationType.TIERED && (
                <div className="space-y-4">
                  <h4 className="font-medium">Refund Tiers</h4>
                  
                  {/* Existing Tiers */}
                  {formData.refundTiers.map((tier, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                      <Badge variant="outline">{tier.hoursBeforeBooking}h before</Badge>
                      <span>{tier.refundPercentage}% refund</span>
                      {tier.fixedFee > 0 && <span>+ ${tier.fixedFee} fee</span>}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTier(index)}
                        className="ml-auto text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Add New Tier */}
                  <div className="flex items-end gap-4 p-3 border-2 border-dashed rounded-lg">
                    <div>
                      <Label>Hours Before</Label>
                      <Input
                        type="number"
                        min="0"
                        value={newTier.hoursBeforeBooking || ''}
                        onChange={(e) => setNewTier(prev => ({ 
                          ...prev, 
                          hoursBeforeBooking: parseInt(e.target.value) || 0 
                        }))}
                        placeholder="24"
                      />
                    </div>
                    <div>
                      <Label>Refund %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={newTier.refundPercentage || ''}
                        onChange={(e) => setNewTier(prev => ({ 
                          ...prev, 
                          refundPercentage: parseInt(e.target.value) || 0 
                        }))}
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <Label>Fixed Fee</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newTier.fixedFee || ''}
                        onChange={(e) => setNewTier(prev => ({ 
                          ...prev, 
                          fixedFee: parseFloat(e.target.value) || 0 
                        }))}
                        placeholder="0"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTier}
                      disabled={!newTier.hoursBeforeBooking || newTier.refundPercentage === undefined}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Policy Options */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-semibold">Policy Options</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Active Policy</Label>
                    <p className="text-sm text-gray-600">Enable this refund policy</p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Default Policy</Label>
                    <p className="text-sm text-gray-600">Set as default refund policy</p>
                  </div>
                  <Switch
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Same Day Refund</Label>
                    <p className="text-sm text-gray-600">Allow refunds on booking day</p>
                  </div>
                  <Switch
                    checked={formData.allowSameDayRefund}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowSameDayRefund: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Partial Refund</Label>
                    <p className="text-sm text-gray-600">Allow partial refunds</p>
                  </div>
                  <Switch
                    checked={formData.allowPartialRefund}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowPartialRefund: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Approval</Label>
                    <p className="text-sm text-gray-600">Require manual approval</p>
                  </div>
                  <Switch
                    checked={formData.requireApproval}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requireApproval: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Force Majeure Full Refund</Label>
                    <p className="text-sm text-gray-600">Full refund for emergencies</p>
                  </div>
                  <Switch
                    checked={formData.forceMajeureFullRefund}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, forceMajeureFullRefund: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <Card>
            <CardContent className="pt-6">
              <Label htmlFor="terms">Terms and Conditions</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                placeholder="Enter specific terms and conditions for this refund policy..."
                rows={4}
              />
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-[#d4203d] hover:bg-[#b91c3a] text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {policy ? 'Update Policy' : 'Create Policy'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
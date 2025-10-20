'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dropdown, DropdownItem } from '@/components/ui';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Save, DollarSign, Clock, TrendingUp, Plus, Minus } from 'lucide-react';
import { useFinanceSettings, useUpdateFinanceSettings } from '@/hooks/useSettings';

type CommissionSettings = {
  defaultRate: number;
  minimumRate: number;
  maximumRate: number;
  autoCalculation: boolean;
  categoryOverrides?: { category: string; commission: number }[];
};

type PayoutSettings = {
  minimumAmount: number;
  processingFee: number;
  autoApproval: boolean;
  schedule: "weekly" | "biweekly" | "monthly";
  processingDay?: string;
};

type TaxSettings = {
  gstRate: number;
  tdsRate: number;
  enableAutoTax: boolean;
  taxInclusive: boolean;
};



// Removed mock data - component now uses API data exclusively



const categories = [
  "Coworking",
  "Meeting Rooms",
  "Event Spaces",
  "Private Offices",
  "Virtual Offices"
];

// const formatCurrency = (amount: number) => {
//   return new Intl.NumberFormat('en-IN', {
//     style: 'currency',
//     currency: 'INR',
//     minimumFractionDigits: 0
//   }).format(amount);
// };

export default function FinanceSettingsContent() {
  const { data: financeSettings, isLoading: isLoadingSettings } = useFinanceSettings();
  const updateFinanceSettings = useUpdateFinanceSettings();
  
  // Local state for form data
  const [commissionSettings, setCommissionSettings] = useState<CommissionSettings>({
    defaultRate: 15,
    minimumRate: 5,
    maximumRate: 30,
    autoCalculation: true,
    categoryOverrides: []
  });
  
  const [payoutSettings, setPayoutSettings] = useState<PayoutSettings>({
    minimumAmount: 1000,
    processingFee: 2.5,
    autoApproval: false,
    schedule: 'weekly'
  });
  
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    gstRate: 18,
    tdsRate: 1,
    enableAutoTax: true,
    taxInclusive: false
  });

  // Update local state when API data is loaded
  useEffect(() => {
    if (financeSettings) {
      if (financeSettings.commission) {
        // Map API structure to local state structure
        setCommissionSettings({
          defaultRate: financeSettings.commission.globalCommission || 15,
          minimumRate: 5, // Default values since API doesn't provide these
          maximumRate: 50,
          autoCalculation: true,
          categoryOverrides: financeSettings.commission.categoryOverrides || []
        });
      }
      if (financeSettings.payout) {
        // Map API structure to local state structure
        setPayoutSettings({
          minimumAmount: financeSettings.payout.minimumThreshold || 100,
          processingFee: 2.5, // Default value since API doesn't provide this
          autoApproval: financeSettings.payout.autoPayouts || false,
          schedule: financeSettings.payout.payoutCycle || "weekly",
          processingDay: financeSettings.payout.processingDay
        });
      }
      if (financeSettings.tax) {
        // Map API structure to local state structure
        setTaxSettings({
          gstRate: financeSettings.tax.gstRate || 18,
          tdsRate: financeSettings.tax.tdsRate || 1,
          enableAutoTax: financeSettings.tax.taxEnabled || true,
          taxInclusive: false // Default value since API doesn't provide this
        });
      }
    }
  }, [financeSettings]);

  const handleSave = async () => {
    try {
      // Map local state back to API structure
      await updateFinanceSettings.mutateAsync({
        commission: {
          globalCommission: commissionSettings.defaultRate,
          categoryOverrides: commissionSettings.categoryOverrides || []
        },
        payout: {
          autoPayouts: payoutSettings.autoApproval,
          payoutCycle: payoutSettings.schedule,
          minimumThreshold: payoutSettings.minimumAmount,
          processingDay: payoutSettings.processingDay || "monday"
        },
        tax: {
          tdsRate: taxSettings.tdsRate,
          gstRate: taxSettings.gstRate,
          taxEnabled: taxSettings.enableAutoTax
        }
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const addCategoryOverride = () => {
    const availableCategories = categories.filter(
      cat => !(commissionSettings.categoryOverrides || []).find(override => override.category === cat)
    );
    if (availableCategories.length > 0) {
      setCommissionSettings(prev => ({
        ...prev,
        categoryOverrides: [...(prev.categoryOverrides || []), { category: availableCategories[0], commission: prev.defaultRate }]
      }));
    }
  };

  const removeCategoryOverride = (index: number) => {
    setCommissionSettings(prev => ({
      ...prev,
      categoryOverrides: (prev.categoryOverrides || []).filter((_, i) => i !== index)
    }));
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Settings</h1>
          <p className="text-gray-600">Manage commission, payouts, and tax settings</p>
        </div>
        <Button onClick={handleSave} disabled={updateFinanceSettings.isPending || isLoadingSettings} className="bg-red-600 hover:bg-red-700">
          {updateFinanceSettings.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Commission Settings
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure global commission rates and category-specific overrides
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <Label htmlFor="defaultRate">Default Commission Rate (%)</Label>
              <Input
                id="defaultRate"
                type="number"
                min="0"
                max="100"
                step={0.1}
                value={commissionSettings.defaultRate}
                onChange={(e) => setCommissionSettings(prev => ({ ...prev, defaultRate: parseFloat(e.target.value) }))}
              />
            </div>
            
            <div className="border-t border-gray-200 my-4"></div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Category Overrides</Label>
                <Button variant="outline" size="sm" onClick={addCategoryOverride}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Override
                </Button>
              </div>
              
              <div className="space-y-3">
                {(commissionSettings.categoryOverrides || []).map((override, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Select value={override.category} onValueChange={(value) => {
                        const newOverrides = [...(commissionSettings.categoryOverrides || [])];
                        newOverrides[index].category = value;
                        setCommissionSettings(prev => ({ ...prev, categoryOverrides: newOverrides }));
                      }}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step={0.1}
                      value={override.commission}
                      onChange={(e) => {
                        const newOverrides = [...(commissionSettings.categoryOverrides || [])];
                        newOverrides[index].commission = parseFloat(e.target.value);
                        setCommissionSettings(prev => ({ ...prev, categoryOverrides: newOverrides }));
                      }}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-600">%</span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCategoryOverride(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Payout Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Payout Settings
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure automatic payouts and processing schedules
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoApproval">Auto Approval</Label>
                <p className="text-sm text-gray-600">Enable automatic payout approval</p>
              </div>
              <input
                type="checkbox"
                id="autoApproval"
                checked={payoutSettings.autoApproval}
                onChange={(e) => setPayoutSettings(prev => ({ ...prev, autoApproval: e.target.checked }))}
                className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
              />
            </div>
            
            <div>
              <Label htmlFor="schedule">Payout Schedule</Label>
              <Select value={payoutSettings.schedule} onValueChange={(value) => 
                setPayoutSettings(prev => ({ ...prev, schedule: value as "weekly" | "biweekly" | "monthly" }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="processingFee">Processing Fee (%)</Label>
              <Input
                id="processingFee"
                type="number"
                min="0"
                max="100"
                step={0.1}
                value={payoutSettings.processingFee}
                onChange={(e) => setPayoutSettings(prev => ({ ...prev, processingFee: parseFloat(e.target.value) }))}
              />
            </div>
            
            <div>
              <Label htmlFor="minimumAmount">Minimum Payout Amount (₹)</Label>
              <Input
                id="minimumAmount"
                type="number"
                min="0"
                step={0.01}
                value={payoutSettings.minimumAmount}
                onChange={(e) => setPayoutSettings(prev => ({ ...prev, minimumAmount: parseFloat(e.target.value) }))}
              />
            </div>
          </div>
        </div>

        {/* Tax Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Tax Configuration
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure tax rates and deduction settings
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableAutoTax">Enable Auto Tax</Label>
                <p className="text-sm text-gray-600">Automatically calculate and apply taxes</p>
              </div>
              <input
                type="checkbox"
                id="enableAutoTax"
                checked={taxSettings.enableAutoTax}
                onChange={(e) => setTaxSettings(prev => ({ ...prev, enableAutoTax: e.target.checked }))}
                className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
               <div>
                 <Label htmlFor="taxInclusive">Tax Inclusive</Label>
                 <p className="text-sm text-gray-600">Include tax in displayed prices</p>
               </div>
               <input
                 type="checkbox"
                 id="taxInclusive"
                 checked={taxSettings.taxInclusive}
                 onChange={(e) => setTaxSettings(prev => ({ ...prev, taxInclusive: e.target.checked }))}
                 className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
               />
             </div>
          </div>
        </div>


      </div>
    </div>
  );
}
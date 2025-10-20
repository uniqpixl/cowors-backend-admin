"use client";
import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { Settings, Upload, Save, AlertTriangle, Globe, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";

type SystemConfig = {
  platformName: string;
  contactEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  defaultCurrency: string;
  defaultTimezone: string;
  bookingCancellationWindow: number;
  defaultCommission: number;
  logoUrl: string;
  platformStatus: "live" | "maintenance" | "development";
};

const mockSystemConfig: SystemConfig = {
  platformName: "Cowors",
  contactEmail: "support@cowors.com",
  supportPhone: "+91 98765 43210",
  maintenanceMode: false,
  maintenanceMessage: "We are currently performing scheduled maintenance. Please check back soon.",
  defaultCurrency: "INR",
  defaultTimezone: "Asia/Kolkata",
  bookingCancellationWindow: 24,
  defaultCommission: 15,
  logoUrl: "/logo.png",
  platformStatus: "live"
};

const currencies = [
  { value: "INR", label: "Indian Rupee (₹)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" }
];

const timezones = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
  { value: "America/New_York", label: "America/New_York (EST)" },
  { value: "Europe/London", label: "Europe/London (GMT)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT)" }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "live": return "bg-green-100 text-green-800 border-green-200";
    case "maintenance": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "development": return "bg-blue-100 text-blue-800 border-blue-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function SystemConfigContent() {
  const [config, setConfig] = useState<SystemConfig>(mockSystemConfig);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("System configuration updated successfully!");
    setIsLoading(false);
  };

  const handleLogoUpload = () => {
    toast.success("Logo uploaded successfully!");
  };

  const toggleMaintenanceMode = () => {
    setConfig(prev => ({
      ...prev,
      maintenanceMode: !prev.maintenanceMode,
      platformStatus: !prev.maintenanceMode ? "maintenance" : "live"
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
          <p className="text-gray-600">Manage platform settings and system configuration</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(config.platformStatus)}`}>
            <Globe className="w-3 h-3 mr-1" />
            {config.platformStatus.toUpperCase()}
          </span>
          <Button onClick={handleSave} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Maintenance Mode Alert */}
      {config.maintenanceMode && (
        <div className="border-yellow-200 bg-yellow-50 rounded-lg border p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <h3 className="font-medium text-yellow-800">Maintenance Mode Active</h3>
              <p className="text-sm text-yellow-700">The platform is currently in maintenance mode. Users cannot access the system.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Platform Information
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Basic platform settings and contact information
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <Label htmlFor="platformName">Platform Name</Label>
              <Input
                id="platformName"
                defaultValue={config.platformName}
                onChange={(e) => setConfig(prev => ({ ...prev, platformName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                defaultValue={config.contactEmail}
                onChange={(e) => setConfig(prev => ({ ...prev, contactEmail: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="supportPhone">Support Phone</Label>
              <Input
                id="supportPhone"
                defaultValue={config.supportPhone}
                onChange={(e) => setConfig(prev => ({ ...prev, supportPhone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="logo">Platform Logo</Label>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-8 h-8 text-gray-400" />
                </div>
                <Button variant="outline" onClick={handleLogoUpload}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              System Status
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Control platform availability and maintenance mode
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenance">Maintenance Mode</Label>
                <p className="text-sm text-gray-600">Enable to prevent user access during updates</p>
              </div>
              <input
                type="checkbox"
                id="maintenance"
                checked={config.maintenanceMode}
                onChange={toggleMaintenanceMode}
                className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
              />
            </div>
            {config.maintenanceMode && (
              <div>
                <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                <textarea
                  id="maintenanceMessage"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder="Message to display to users during maintenance"
                  value={config.maintenanceMessage}
                  onChange={(e) => setConfig(prev => ({ ...prev, maintenanceMessage: e.target.value }))}
                />
              </div>
            )}
          </div>
        </div>

        {/* Regional Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Regional Settings
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure currency, timezone, and regional preferences
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <Label htmlFor="currency">Default Currency</Label>
              <Select
                options={currencies}
                defaultValue={config.defaultCurrency}
                onChange={(value) => setConfig(prev => ({ ...prev, defaultCurrency: value }))}
                placeholder="Select currency"
              />
            </div>
            <div>
              <Label htmlFor="timezone">Default Timezone</Label>
              <Select
                options={timezones}
                defaultValue={config.defaultTimezone}
                onChange={(value) => setConfig(prev => ({ ...prev, defaultTimezone: value }))}
                placeholder="Select timezone"
              />
            </div>
          </div>
        </div>

        {/* Business Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Business Settings
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure default business rules and policies
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <Label htmlFor="cancellationWindow">Booking Cancellation Window (hours)</Label>
              <Input
                id="cancellationWindow"
                type="number"
                defaultValue={config.bookingCancellationWindow}
                onChange={(e) => setConfig(prev => ({ ...prev, bookingCancellationWindow: parseInt(e.target.value) }))}
              />
              <p className="text-sm text-gray-600 mt-1">
                Minimum hours before booking start time to allow cancellation
              </p>
            </div>
            <div>
              <Label htmlFor="defaultCommission">Default Commission (%)</Label>
              <Input
                id="defaultCommission"
                type="number"
                min="0"
                max="100"
                step={0.1}
                defaultValue={config.defaultCommission}
                onChange={(e) => setConfig(prev => ({ ...prev, defaultCommission: parseFloat(e.target.value) }))}
              />
              <p className="text-sm text-gray-600 mt-1">
                Default commission rate for new partners
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">System Information</h2>
          <p className="text-sm text-gray-600 mt-1">
            Current system status and information
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Clock className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <h3 className="font-medium">Server Time</h3>
              <p className="text-sm text-gray-600">{new Date().toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Globe className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <h3 className="font-medium">Environment</h3>
              <p className="text-sm text-gray-600">Production</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Settings className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <h3 className="font-medium">Version</h3>
              <p className="text-sm text-gray-600">v1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
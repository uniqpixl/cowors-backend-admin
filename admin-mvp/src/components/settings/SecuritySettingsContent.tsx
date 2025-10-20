'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import Badge from '@/components/ui/badge/Badge';
import { toast } from 'sonner';
import { 
  Loader2, 
  Save, 
  Shield, 
  Key, 
  Clock, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Smartphone, 
  User, 
  Globe,
  Download,
  Search,
  Filter,
  MoreHorizontal,
  Settings,
  Lock
} from 'lucide-react';
import { useSecuritySettings, useUpdateSecuritySettings, useToggle2FA, useSetup2FA, useVerify2FA } from '@/hooks/useSettings';
import { LoginPolicy } from '@/lib/api/types';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  ip: string;
  status: 'success' | 'failed' | 'warning';
  details: string;
}

const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: '2024-01-15 14:30:25',
    user: 'admin@cowors.com',
    action: 'User Login',
    resource: 'Authentication System',
    ip: '192.168.1.100',
    details: 'Successful login from desktop',
    status: 'success'
  },
  {
    id: '2',
    timestamp: '2024-01-15 14:25:10',
    user: 'manager@cowors.com',
    action: 'Role Modified',
    resource: 'Role Management',
    ip: '192.168.1.105',
    details: 'Role permissions updated',
    status: 'success'
  },
  {
    id: '3',
    timestamp: '2024-01-15 14:20:45',
    user: 'unknown@example.com',
    action: 'Failed Login Attempt',
    resource: 'Authentication System',
    ip: '203.0.113.42',
    details: 'Invalid credentials provided',
    status: 'failed'
  }
];



export default function SecuritySettingsContent() {
  const { data: securitySettings, isLoading: isLoadingSettings } = useSecuritySettings();
  const updateSecuritySettings = useUpdateSecuritySettings();
  const toggle2FA = useToggle2FA();
  const setup2FA = useSetup2FA();
  const verify2FA = useVerify2FA();

  // Local state for form data
  const [loginPolicies, setLoginPolicies] = useState<LoginPolicy[]>([]);
  
  const [loginSettings, setLoginSettings] = useState({
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    passwordExpiry: 90,
    requireStrongPassword: true,
    enableTwoFactor: false
  });
  
  const [sessionSettings, setSessionSettings] = useState({
    sessionTimeout: 60,
    maxConcurrentSessions: 3,
    requireReauth: true
  });
  
  const [auditSettings, setAuditSettings] = useState({
    logRetention: 365,
    enableRealTimeAlerts: true,
    alertThreshold: 'medium'
  });

  const [auditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  // Update local state when API data is loaded
  useEffect(() => {
    if (securitySettings) {
      if (securitySettings.loginPolicies) {
        setLoginPolicies(securitySettings.loginPolicies);
      }
      // Update login settings based on security settings
      setLoginSettings(prev => ({
        ...prev,
        enableTwoFactor: securitySettings.twoFactorEnabled
      }));
      // Update session settings based on security settings
      setSessionSettings(prev => ({
        ...prev,
        sessionTimeout: securitySettings.sessionTimeout
      }));
    }
  }, [securitySettings]);

  const handleTogglePolicy = (field: string) => {
    setLoginSettings(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
    }));
  };

  const handleToggle2FA = async () => {
    if (!loginSettings.enableTwoFactor) {
      try {
        const setupData = await setup2FA.mutateAsync();
        setQrCodeUrl(setupData.qrCode);
        // Generate mock backup codes since they're not returned by the API
        const mockBackupCodes = Array.from({ length: 8 }, () => 
          Math.random().toString(36).substring(2, 8).toUpperCase()
        );
        setBackupCodes(mockBackupCodes);
        setShow2FAModal(true);
      } catch (error) {
        // Error handling is done in the hook
      }
    } else {
      try {
        await toggle2FA.mutateAsync(false);
        setLoginSettings(prev => ({ ...prev, enableTwoFactor: false }));
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  };

  const handleSetup2FA = () => {
    setQrCodeGenerated(true);
  };

  const handleVerify2FA = async () => {
    try {
      const result = await verify2FA.mutateAsync(verificationCode);
      if (result.success) {
        setLoginSettings(prev => ({ ...prev, enableTwoFactor: true }));
        setShow2FAModal(false);
        setVerificationCode('');
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };



  const handleSaveSettings = async () => {
    try {
      await updateSecuritySettings.mutateAsync({
        twoFactorEnabled: loginSettings.enableTwoFactor,
        loginPolicies,
        sessionTimeout: sessionSettings.sessionTimeout,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
        }
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge color="success">Success</Badge>;
      case 'failed':
        return <Badge color="error">Failed</Badge>;
      case 'warning':
        return <Badge color="warning">Warning</Badge>;
      default:
        return <Badge variant="light" color="light">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-gray-600 mt-1">Manage authentication, access policies, and security monitoring</p>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-red-600" />
            Two-Factor Authentication
          </h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h3 className="text-base font-medium text-gray-900">2FA Status</h3>
                {loginSettings.enableTwoFactor ? (
                  <Badge color="success">Enabled</Badge>
                ) : (
                  <Badge color="error">Disabled</Badge>
                )}
              </div>
              <p className="text-gray-600 mt-1">
                {loginSettings.enableTwoFactor 
                  ? 'Two-factor authentication is active for your account'
                  : 'Add an extra layer of security to your account'
                }
              </p>
            </div>
            <div className="flex space-x-3">
              {loginSettings.enableTwoFactor ? (
                <Button
                  variant="outline"
                  onClick={handleToggle2FA}
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  Disable 2FA
                </Button>
              ) : (
                <Button
                  onClick={handleToggle2FA}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Setup 2FA
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Login Policies */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Key className="w-5 h-5 mr-2 text-red-600" />
            Login Policies
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Strong Password Required</h4>
                <p className="text-sm text-gray-600">Require users to use strong passwords with special characters</p>
              </div>
              <Switch
                checked={loginSettings.requireStrongPassword}
                onCheckedChange={() => handleTogglePolicy('requireStrongPassword')}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-600">Require 2FA for all user accounts</p>
              </div>
              <Switch
                checked={loginSettings.enableTwoFactor}
                onCheckedChange={() => handleTogglePolicy('enableTwoFactor')}
              />
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Login Attempts
                  </label>
                  <input
                    type="number"
                    value={loginSettings.maxLoginAttempts}
                    onChange={(e) => setLoginSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lockout Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={loginSettings.lockoutDuration}
                    onChange={(e) => setLoginSettings(prev => ({ ...prev, lockoutDuration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password Expiry (days)
                  </label>
                  <input
                    type="number"
                    value={loginSettings.passwordExpiry}
                    onChange={(e) => setLoginSettings(prev => ({ ...prev, passwordExpiry: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Button
              onClick={handleSaveSettings}
              disabled={updateSecuritySettings.isPending || isLoadingSettings}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {updateSecuritySettings.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Login Policies'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Session Management */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-red-600" />
            Session Management
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                value={sessionSettings.sessionTimeout}
                onChange={(e) => setSessionSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Concurrent Sessions
              </label>
              <input
                type="number"
                value={sessionSettings.maxConcurrentSessions}
                onChange={(e) => setSessionSettings(prev => ({ ...prev, maxConcurrentSessions: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          <div className="mt-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={sessionSettings.requireReauth}
                onChange={(e) => setSessionSettings(prev => ({ ...prev, requireReauth: e.target.checked }))}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Require re-authentication for sensitive operations
              </span>
            </label>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Button
              onClick={handleSaveSettings}
              disabled={updateSecuritySettings.isPending || isLoadingSettings}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {updateSecuritySettings.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Session Settings'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-red-600" />
              Audit Logs
            </h2>
            <Button variant="outline" size="sm">
              Export Logs
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      {log.timestamp}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      {log.user}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.resource}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-2 text-gray-400" />
                      {log.ip}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(log.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Setup 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Setup Two-Factor Authentication</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShow2FAModal(false)}
            >
              <span className="sr-only">Close</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </Button>
          </div>

          {!qrCodeGenerated ? (
            <>
              <div className="text-center">
                <Shield className="w-12 h-12 mx-auto text-red-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Secure Your Account</h3>
                <p className="text-gray-600">
                  Two-factor authentication adds an extra layer of security to your account.
                  You will need an authenticator app like Google Authenticator or Authy.
                </p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShow2FAModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSetup2FA}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Continue
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="w-48 h-48 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <Key className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">QR Code</p>
                    <p className="text-xs text-gray-400">Scan with authenticator app</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Scan this QR code with your authenticator app, then enter the 6-digit code below.
                </p>
              </div>
              <div>
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  defaultValue={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShow2FAModal(false);
                    setQrCodeGenerated(false);
                    setVerificationCode('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVerify2FA}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={verificationCode.length !== 6}
                >
                  Verify & Enable
                </Button>
              </div>
            </>
          )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
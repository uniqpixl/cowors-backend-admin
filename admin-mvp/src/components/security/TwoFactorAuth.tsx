"use client";
import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal/index";
import Alert from "@/components/ui/alert/Alert";
import Image from "next/image";
import { Shield, Smartphone, Key, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";

type TwoFactorStatus = {
  isEnabled: boolean;
  backupCodes: string[];
  lastUsed?: string;
  deviceName?: string;
};

interface TwoFactorAuthProps {
  userEmail: string;
  userRole: string;
  isRequired?: boolean;
  onStatusChange?: (enabled: boolean) => void;
}

export default function TwoFactorAuth({ 
  userEmail, 
  userRole, 
  isRequired = false, 
  onStatusChange 
}: TwoFactorAuthProps) {
  const [status, setStatus] = useState<TwoFactorStatus>({
    isEnabled: false,
    backupCodes: [],
    lastUsed: undefined,
    deviceName: undefined
  });
  
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeSecret] = useState("JBSWY3DPEHPK3PXP"); // Mock secret
  const [backupCodes] = useState([
    "12345-67890", "23456-78901", "34567-89012", "45678-90123",
    "56789-01234", "67890-12345", "78901-23456", "89012-34567"
  ]);

  const handleEnable2FA = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setStatus({
      isEnabled: true,
      backupCodes: backupCodes,
      lastUsed: new Date().toISOString(),
      deviceName: "Authenticator App"
    });
    
    setShowSetupDialog(false);
    setSetupStep(1);
    setVerificationCode("");
    setPassword("");
    onStatusChange?.(true);
    toast.success("Two-factor authentication enabled successfully!");
    setIsLoading(false);
  };

  const handleDisable2FA = async () => {
    if (isRequired) {
      toast.error("2FA is required for your role and cannot be disabled");
      return;
    }
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setStatus({
      isEnabled: false,
      backupCodes: [],
      lastUsed: undefined,
      deviceName: undefined
    });
    
    setShowDisableDialog(false);
    setPassword("");
    onStatusChange?.(false);
    toast.success("Two-factor authentication disabled");
    setIsLoading(false);
  };

  const copyBackupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Backup code copied to clipboard");
  };

  const copyAllBackupCodes = () => {
    const allCodes = backupCodes.join("\n");
    navigator.clipboard.writeText(allCodes);
    toast.success("All backup codes copied to clipboard");
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/Cowors:${encodeURIComponent(userEmail)}?secret=${qrCodeSecret}&issuer=Cowors`;

  return (
    <ComponentCard 
      title="Two-Factor Authentication"
      desc="Add an extra layer of security to your account"
    >
      <div className="space-y-4">
        {isRequired && !status.isEnabled && (
          <Alert
            variant="warning"
            title="Two-Factor Authentication Required"
            message={`Two-factor authentication is required for ${userRole} role. Please enable it to continue using admin features.`}
          />
        )}
        
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              status.isEnabled ? "bg-green-100" : "bg-gray-100"
            }`}>
              {status.isEnabled ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Smartphone className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <div>
              <h3 className="font-medium">
                {status.isEnabled ? "2FA Enabled" : "2FA Disabled"}
              </h3>
              <p className="text-sm text-gray-600">
                {status.isEnabled 
                  ? `Last used: ${status.lastUsed ? new Date(status.lastUsed).toLocaleDateString() : "Never"}`
                  : "Authenticator app not configured"
                }
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {status.isEnabled ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowSetupDialog(true)}>
                  <Key className="w-4 h-4 mr-2" />
                  Backup Codes
                </Button>
                
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDisableDialog(true)}
                  disabled={isRequired}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Disable
                </Button>
              </>
            ) : (
              <Button className="bg-red-600 hover:bg-red-700" onClick={() => setShowSetupDialog(true)}>
                Enable 2FA
              </Button>
            )}
          </div>
        </div>
        
        {status.isEnabled && (
          <div className="text-sm text-gray-600">
            <p>✓ Your account is protected with two-factor authentication</p>
            <p>✓ {status.backupCodes.length} backup codes available</p>
            <p>✓ Device: {status.deviceName}</p>
          </div>
        )}
      </div>
      
      {/* Backup Codes Modal */}
      <Modal isOpen={showSetupDialog && status.isEnabled} onClose={() => setShowSetupDialog(false)} className="max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Backup Codes</h2>
          </div>
          
          <p className="text-gray-600 mb-6">
            Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
          </p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {status.backupCodes.map((code, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded font-mono text-sm">
                  <span className="flex-1">{code}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyBackupCode(code)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
            <Button onClick={copyAllBackupCodes} variant="outline" className="w-full">
              <Copy className="w-4 h-4 mr-2" />
              Copy All Codes
            </Button>
            <div className="flex justify-end">
              <Button onClick={() => setShowSetupDialog(false)}>Close</Button>
            </div>
          </div>
        </div>
      </Modal>
      
      {/* Disable 2FA Modal */}
      <Modal isOpen={showDisableDialog} onClose={() => setShowDisableDialog(false)} className="max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Disable Two-Factor Authentication</h2>
          </div>
          
          <p className="text-gray-600 mb-6">
            This will remove the extra security layer from your account. Enter your password to confirm.
          </p>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="disable-password">Current Password</Label>
              <Input
                id="disable-password"
                type="password"
                defaultValue={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="Enter your current password"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="outline"
              onClick={handleDisable2FA}
              disabled={!password || isLoading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isLoading ? "Disabling..." : "Disable 2FA"}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Setup 2FA Modal */}
      <Modal isOpen={showSetupDialog && !status.isEnabled} onClose={() => setShowSetupDialog(false)} className="max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Enable Two-Factor Authentication</h2>
          </div>
          
          <p className="text-gray-600 mb-4">
            Step {setupStep} of 3: {setupStep === 1 ? "Download App" : setupStep === 2 ? "Scan QR Code" : "Verify Setup"}
          </p>
          
          {setupStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                First, download an authenticator app on your mobile device:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 border rounded">
                  <Smartphone className="w-4 h-4" />
                  <span className="text-sm">Google Authenticator</span>
                </div>
                <div className="flex items-center gap-2 p-2 border rounded">
                  <Smartphone className="w-4 h-4" />
                  <span className="text-sm">Microsoft Authenticator</span>
                </div>
                <div className="flex items-center gap-2 p-2 border rounded">
                  <Smartphone className="w-4 h-4" />
                  <span className="text-sm">Authy</span>
                </div>
              </div>
            </div>
          )}
          
          {setupStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Scan this QR code with your authenticator app:
              </p>
              <div className="flex justify-center">
                <div className="p-4 bg-white border rounded-lg">
                  <Image 
                    src={qrCodeUrl} 
                    alt="2FA QR Code" 
                    width={192}
                    height={192}
                    className="w-48 h-48"
                  />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">Or enter this code manually:</p>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">{qrCodeSecret}</code>
              </div>
            </div>
          )}
          
          {setupStep === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter the 6-digit code from your authenticator app:
              </p>
              <div>
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  defaultValue={verificationCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-lg font-mono"
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-between mt-6">
            {setupStep > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setSetupStep(setupStep - 1)}
              >
                Back
              </Button>
            )}
            
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setShowSetupDialog(false)}>
                Cancel
              </Button>
              
              {setupStep < 3 ? (
                <Button 
                  onClick={() => setSetupStep(setupStep + 1)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleEnable2FA}
                  disabled={verificationCode.length !== 6 || isLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isLoading ? "Enabling..." : "Enable 2FA"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </ComponentCard>
  );
}

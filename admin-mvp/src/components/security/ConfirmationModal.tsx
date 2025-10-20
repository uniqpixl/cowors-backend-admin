"use client";
import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import { AlertTriangle, Shield, DollarSign, User, Settings, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal/index";

type ActionType = 'financial' | 'user_management' | 'system_config' | 'data_deletion' | 'security';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface ConfirmationAction {
  type: ActionType;
  title: string;
  description: string;
  riskLevel: RiskLevel;
  requiresPassword?: boolean;
  requiresReason?: boolean;
  requires2FA?: boolean;
  confirmationText?: string;
  details?: Record<string, unknown>;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { password?: string; reason?: string; twoFactorCode?: string }) => Promise<void>;
  action: ConfirmationAction;
  has2FA: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  has2FA
}: ConfirmationModalProps) {
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const getActionIcon = (type: ActionType) => {
    switch (type) {
      case 'financial':
        return <DollarSign className="w-5 h-5" />;
      case 'user_management':
        return <User className="w-5 h-5" />;
      case 'system_config':
        return <Settings className="w-5 h-5" />;
      case 'data_deletion':
        return <Trash2 className="w-5 h-5" />;
      case 'security':
        return <Lock className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const resetForm = () => {
    setPassword("");
    setReason("");
    setTwoFactorCode("");
    setConfirmationInput("");
    setStep(1);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    
    try {
      await onConfirm({
        password: action.requiresPassword ? password : undefined,
        reason: action.requiresReason ? reason : undefined,
        twoFactorCode: action.requires2FA ? twoFactorCode : undefined
      });
      
      toast.success("Action completed successfully");
      handleClose();
    } catch (error) {
      console.error("Action failed:", error);
      toast.error("Action failed. Please try again.");
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    if (action.requiresPassword && !password) return false;
    if (action.requiresReason && !reason.trim()) return false;
    if (action.requires2FA && twoFactorCode.length !== 6) return false;
    if (action.confirmationText && confirmationInput !== action.confirmationText) return false;
    return true;
  };

  const requiresStepUp = action.requires2FA && has2FA && (action.riskLevel === 'high' || action.riskLevel === 'critical');
  const totalSteps = requiresStepUp ? 2 : 1;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          {getActionIcon(action.type)}
          <h2 className="text-xl font-semibold">Confirm Action</h2>
          {requiresStepUp && (
            <Badge variant="light" color="light">
              Step {step} of {totalSteps}
            </Badge>
          )}
        </div>
        
        <p className="text-gray-600 mb-6">
          {step === 1 ? action.description : "Enter your 2FA code to complete this action"}
        </p>

        <div className="space-y-4">
          {/* Risk Level Indicator */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Risk Level:</span>
            <Badge 
              variant="light" 
              color={action.riskLevel === 'low' ? 'light' : action.riskLevel === 'medium' ? 'warning' : action.riskLevel === 'high' ? 'error' : 'error'}
            >
              {action.riskLevel.toUpperCase()}
            </Badge>
          </div>

          {/* Action Details */}
          {action.details && Object.keys(action.details).length > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Action Details:</h4>
              <div className="space-y-1 text-sm">
                {Object.entries(action.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* High Risk Warning */}
          {(action.riskLevel === 'high' || action.riskLevel === 'critical') && (
            <Alert
              variant={action.riskLevel === 'critical' ? 'error' : 'warning'}
              title={action.riskLevel === 'critical' ? 'Critical Action' : 'High Risk Action'}
              message={action.riskLevel === 'critical' 
                ? "This is a critical action that cannot be undone. Please proceed with extreme caution."
                : "This action has significant impact. Please review carefully before proceeding."
              }
            />
          )}

          {step === 1 && (
            <>
              {/* Confirmation Text Input */}
              {action.confirmationText && (
                <div>
                  <Label htmlFor="confirmation-text">
                    Type <code className="bg-gray-100 px-1 rounded">{action.confirmationText}</code> to confirm
                  </Label>
                  <Input
                    id="confirmation-text"
                    defaultValue={confirmationInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmationInput(e.target.value)}
                    placeholder={action.confirmationText}
                    className={confirmationInput === action.confirmationText ? "border-green-500" : ""}
                  />
                </div>
              )}

              {/* Password Input */}
              {action.requiresPassword && (
                <div>
                  <Label htmlFor="password">Current Password</Label>
                  <Input
                    id="password"
                    type="password"
                    defaultValue={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    placeholder="Enter your current password"
                  />
                </div>
              )}

              {/* Reason Input */}
              {action.requiresReason && (
                <div>
                  <Label htmlFor="reason">Reason for Action</Label>
                  <TextArea
                    value={reason}
                    onChange={(value: string) => setReason(value)}
                    placeholder="Provide a reason for this action (required for audit trail)"
                    rows={3}
                  />
                </div>
              )}

              {/* 2FA for non-step-up scenarios */}
              {action.requires2FA && !requiresStepUp && (
                <div>
                  <Label htmlFor="two-factor-code">Two-Factor Authentication Code</Label>
                  <Input
                    id="two-factor-code"
                    defaultValue={twoFactorCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="text-center text-lg font-mono"
                  />
                </div>
              )}
            </>
          )}

          {step === 2 && requiresStepUp && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">Two-Factor Authentication Required</span>
              </div>
              <Label htmlFor="step-up-2fa">Enter your 2FA code</Label>
              <Input
                id="step-up-2fa"
                defaultValue={twoFactorCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-lg font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Open your authenticator app and enter the 6-digit code
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          
          {requiresStepUp && step === 1 ? (
            <Button 
              onClick={() => setStep(2)}
              disabled={!canProceed() || isLoading}
            >
              Continue
            </Button>
          ) : (
            <Button 
              onClick={handleConfirm}
              disabled={!canProceed() || isLoading}
              variant={action.riskLevel === 'critical' ? 'outline' : 'primary'}
            >
              {isLoading ? "Processing..." : "Confirm Action"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// Helper function to create confirmation actions
export const createConfirmationAction = {
  financial: (title: string, description: string, details?: Record<string, unknown>): ConfirmationAction => ({
    type: 'financial',
    title,
    description,
    riskLevel: 'high',
    requiresPassword: true,
    requiresReason: true,
    requires2FA: true,
    details
  }),
  
  userManagement: (title: string, description: string, riskLevel: RiskLevel = 'medium', details?: Record<string, unknown>): ConfirmationAction => ({
    type: 'user_management',
    title,
    description,
    riskLevel,
    requiresPassword: riskLevel === 'high' || riskLevel === 'critical',
    requiresReason: true,
    requires2FA: riskLevel === 'critical',
    details
  }),
  
  systemConfig: (title: string, description: string, riskLevel: RiskLevel = 'medium', details?: Record<string, unknown>): ConfirmationAction => ({
    type: 'system_config',
    title,
    description,
    riskLevel,
    requiresPassword: riskLevel === 'high' || riskLevel === 'critical',
    requiresReason: riskLevel !== 'low',
    requires2FA: riskLevel === 'critical',
    details
  }),
  
  dataDeletion: (title: string, description: string, confirmationText?: string, details?: Record<string, unknown>): ConfirmationAction => ({
    type: 'data_deletion',
    title,
    description,
    riskLevel: 'critical',
    requiresPassword: true,
    requiresReason: true,
    requires2FA: true,
    confirmationText,
    details
  }),
  
  security: (title: string, description: string, riskLevel: RiskLevel = 'high', details?: Record<string, unknown>): ConfirmationAction => ({
    type: 'security',
    title,
    description,
    riskLevel,
    requiresPassword: true,
    requiresReason: riskLevel !== 'low',
    requires2FA: riskLevel === 'high' || riskLevel === 'critical',
    details
  })
};
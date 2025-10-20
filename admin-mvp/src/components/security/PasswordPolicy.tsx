"use client";
import React, { useState, useEffect } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import { Check, X, Eye, EyeOff, Info } from "lucide-react";
import { toast } from "sonner";

interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
  required: boolean;
}

interface PasswordPolicyProps {
  onPasswordChange?: (password: string, isValid: boolean, strength: number) => void;
  showStrengthMeter?: boolean;
  showRequirements?: boolean;
  enforcePolicy?: boolean;
  currentPassword?: string;
  mode?: 'create' | 'change' | 'reset';
}

const passwordRequirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'At least 12 characters long',
    test: (password) => password.length >= 12,
    required: true
  },
  {
    id: 'uppercase',
    label: 'Contains uppercase letter (A-Z)',
    test: (password) => /[A-Z]/.test(password),
    required: true
  },
  {
    id: 'lowercase',
    label: 'Contains lowercase letter (a-z)',
    test: (password) => /[a-z]/.test(password),
    required: true
  },
  {
    id: 'number',
    label: 'Contains number (0-9)',
    test: (password) => /[0-9]/.test(password),
    required: true
  },
  {
    id: 'special',
    label: 'Contains special character (!@#$%^&*)',
    test: (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    required: true
  },
  {
    id: 'no_common',
    label: 'Not a common password',
    test: (password) => {
      const commonPasswords = [
        'password', '123456', '123456789', 'qwerty', 'abc123',
        'password123', 'admin', 'letmein', 'welcome', 'monkey'
      ];
      return !commonPasswords.some(common => 
        password.toLowerCase().includes(common.toLowerCase())
      );
    },
    required: true
  },
  {
    id: 'no_personal',
    label: 'Does not contain personal information',
    test: (password) => {
      // This would typically check against user's name, email, etc.
      // For demo purposes, we'll check against common personal info patterns
      const personalPatterns = [
        /admin/i, /user/i, /test/i, /demo/i, /cowors/i
      ];
      return !personalPatterns.some(pattern => pattern.test(password));
    },
    required: true
  },
  {
    id: 'no_sequential',
    label: 'No sequential characters (123, abc)',
    test: (password) => {
      const sequential = [
        '123', '234', '345', '456', '567', '678', '789',
        'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi'
      ];
      return !sequential.some(seq => 
        password.toLowerCase().includes(seq)
      );
    },
    required: false
  }
];

export default function PasswordPolicy({
  onPasswordChange,
  showStrengthMeter = true,
  showRequirements = true,
  enforcePolicy = true,
  currentPassword,
  mode = 'create'
}: PasswordPolicyProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const calculateStrength = (pwd: string): number => {
    if (!pwd) return 0;
    
    let score = 0;
    const maxScore = passwordRequirements.length;
    
    passwordRequirements.forEach(req => {
      if (req.test(pwd)) {
        score += req.required ? 1 : 0.5;
      }
    });
    
    return Math.min(100, (score / maxScore) * 100);
  };

  const getStrengthLabel = (strength: number): { label: string; color: string } => {
    if (strength < 25) return { label: 'Very Weak', color: 'text-red-600' };
    if (strength < 50) return { label: 'Weak', color: 'text-orange-600' };
    if (strength < 75) return { label: 'Good', color: 'text-yellow-600' };
    if (strength < 90) return { label: 'Strong', color: 'text-blue-600' };
    return { label: 'Very Strong', color: 'text-green-600' };
  };



  const isPasswordValid = (): boolean => {
    if (!enforcePolicy) return password.length > 0;
    
    const requiredTests = passwordRequirements.filter(req => req.required);
    return requiredTests.every(req => req.test(password));
  };

  const passwordsMatch = password === confirmPassword;
  const strength = calculateStrength(password);
  const strengthInfo = getStrengthLabel(strength);
  const isValid = isPasswordValid() && passwordsMatch;

  useEffect(() => {
    onPasswordChange?.(password, isValid, strength);
  }, [password, isValid, strength, onPasswordChange]);

  const handlePasswordUpdate = async () => {
    if (!isValid) {
      toast.error("Please ensure password meets all requirements");
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Password updated successfully");
    setPassword("");
    setConfirmPassword("");
    setIsLoading(false);
  };

  return (
    <ComponentCard 
      title={`Password ${mode === 'create' ? 'Requirements' : mode === 'change' ? 'Change' : 'Reset'}`}
      desc={
        mode === 'create' ? "Create a strong password that meets our security requirements" :
        mode === 'change' ? "Update your password to maintain account security" :
        "Reset your password with a new secure password"
      }
    >
      <div className="space-y-4">
        {mode === 'change' && (
          <div>
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type="password"
                defaultValue={currentPassword ?? ""}
                placeholder="Enter your current password"
                className="bg-gray-50"
              />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="new-password">
            {mode === 'change' ? 'New Password' : 'Password'}
          </Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              defaultValue={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="Enter a strong password"
              className={`pr-10 ${
                password && !isPasswordValid() ? "border-red-500" : 
                password && isPasswordValid() ? "border-green-500" : ""
              }`}
            />
            <Button
              variant="outline"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              defaultValue={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className={`pr-10 ${
                confirmPassword && !passwordsMatch ? "border-red-500" : 
                confirmPassword && passwordsMatch ? "border-green-500" : ""
              }`}
            />
            <Button
              variant="outline"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
          )}
        </div>

        {showStrengthMeter && password && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Password Strength</span>
              <Badge variant="light" color={strength < 25 ? 'error' : strength < 50 ? 'warning' : strength < 75 ? 'info' : 'success'}>
                {strengthInfo.label}
              </Badge>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                style={{ width: `${strength}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Weak</span>
              <span>Strong</span>
            </div>
          </div>
        )}

        {showRequirements && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Info className="w-4 h-4" />
              Password Requirements
            </h4>
            <div className="grid gap-2">
              {passwordRequirements.map((req) => {
                const isValid = req.test(password);
                return (
                  <div key={req.id} className="flex items-center gap-2 text-sm">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      isValid ? "bg-green-100" : "bg-gray-100"
                    }`}>
                      {isValid ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <X className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                    <span className={`${
                      isValid ? "text-green-700" : "text-gray-600"
                    }`}>
                      {req.label}
                    </span>
                    {req.required && (
                      <Badge variant="light" color="light" size="sm">
                        Required
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {enforcePolicy && password && !isPasswordValid() && (
          <Alert
            variant="error"
            title="Password Requirements"
            message="Password must meet all required security criteria before you can proceed."
          />
        )}

        {mode !== 'create' && (
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handlePasswordUpdate}
              disabled={!isValid || isLoading}
            >
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
            <Button variant="outline">
              Cancel
            </Button>
          </div>
        )}
      </div>
    </ComponentCard>
  );
}

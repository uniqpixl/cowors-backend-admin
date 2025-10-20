import { useState, useEffect } from 'react';
import { RefundPolicy, RefundPolicyFormData, RefundCalculationInput, RefundCalculationResult } from '@/types/refund-policies';

interface UseRefundPoliciesReturn {
  policies: RefundPolicy[];
  loading: boolean;
  error: string | null;
  createPolicy: (data: RefundPolicyFormData) => Promise<RefundPolicy>;
  updatePolicy: (id: string, data: Partial<RefundPolicyFormData>) => Promise<RefundPolicy>;
  deletePolicy: (id: string) => Promise<void>;
  togglePolicyStatus: (id: string, isActive: boolean) => Promise<RefundPolicy>;
  setAsDefault: (id: string) => Promise<RefundPolicy>;
  calculateRefund: (input: RefundCalculationInput) => Promise<RefundCalculationResult>;
  refreshPolicies: () => Promise<void>;
}

export const useRefundPolicies = (): UseRefundPoliciesReturn => {
  const [policies, setPolicies] = useState<RefundPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/refund-policies', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch refund policies: ${response.statusText}`);
      }

      const data = await response.json();
      setPolicies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch refund policies');
    } finally {
      setLoading(false);
    }
  };

  const createPolicy = async (data: RefundPolicyFormData): Promise<RefundPolicy> => {
    try {
      setError(null);
      
      const response = await fetch('/api/admin/refund-policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to create refund policy: ${response.statusText}`);
      }

      const newPolicy = await response.json();
      setPolicies(prev => [...prev, newPolicy]);
      return newPolicy;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create refund policy';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updatePolicy = async (id: string, data: Partial<RefundPolicyFormData>): Promise<RefundPolicy> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/admin/refund-policies/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update refund policy: ${response.statusText}`);
      }

      const updatedPolicy = await response.json();
      setPolicies(prev => prev.map(policy => policy.id === id ? updatedPolicy : policy));
      return updatedPolicy;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update refund policy';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deletePolicy = async (id: string): Promise<void> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/admin/refund-policies/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete refund policy: ${response.statusText}`);
      }

      setPolicies(prev => prev.filter(policy => policy.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete refund policy';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const togglePolicyStatus = async (id: string, isActive: boolean): Promise<RefundPolicy> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/admin/refund-policies/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle policy status: ${response.statusText}`);
      }

      const updatedPolicy = await response.json();
      setPolicies(prev => prev.map(policy => policy.id === id ? updatedPolicy : policy));
      return updatedPolicy;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle policy status';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const setAsDefault = async (id: string): Promise<RefundPolicy> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/admin/refund-policies/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ isDefault: true }),
      });

      if (!response.ok) {
        throw new Error(`Failed to set default policy: ${response.statusText}`);
      }

      const updatedPolicy = await response.json();
      // Update all policies - only one can be default
      setPolicies(prev => prev.map(policy => ({
        ...policy,
        isDefault: policy.id === id
      })));
      return updatedPolicy;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set default policy';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const calculateRefund = async (input: RefundCalculationInput): Promise<RefundCalculationResult> => {
    try {
      setError(null);
      
      const response = await fetch('/api/admin/refund-policies/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`Failed to calculate refund: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate refund';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const refreshPolicies = async () => {
    await fetchPolicies();
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  return {
    policies,
    loading,
    error,
    createPolicy,
    updatePolicy,
    deletePolicy,
    togglePolicyStatus,
    setAsDefault,
    calculateRefund,
    refreshPolicies,
  };
};
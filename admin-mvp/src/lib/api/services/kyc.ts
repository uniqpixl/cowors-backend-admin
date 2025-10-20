import { apiRequest } from '../client';
import {
  KycVerification,
  KycVerificationQuery,
  BulkKycReview,
  BulkKycReviewResult,
  PaginatedResponse,
} from '../types';

// KYC Verification API Services
export class KycVerificationService {
  // Get all KYC verifications with filtering and pagination
  static async getAllKycVerifications(query?: KycVerificationQuery): Promise<PaginatedResponse<KycVerification>> {
    return apiRequest<PaginatedResponse<KycVerification>>({
      method: 'GET',
      url: '/api/v1/admin/kyc/verifications',
      params: query,
    });
  }

  // Get KYC verification by ID
  static async getKycVerificationById(id: string): Promise<KycVerification> {
    return apiRequest<KycVerification>({
      method: 'GET',
      url: `/api/v1/admin/kyc/verifications/${id}`,
    });
  }

  // Review KYC verification (approve/reject)
  static async reviewKycVerification(id: string, action: 'approve' | 'reject', reason?: string): Promise<KycVerification> {
    return apiRequest<KycVerification>({
      method: 'POST',
      url: `/api/v1/admin/kyc/verifications/${id}/review`,
      data: { action, reason },
    });
  }

  // Bulk review KYC verifications
  static async bulkReviewKycVerifications(reviewData: BulkKycReview): Promise<BulkKycReviewResult> {
    return apiRequest<BulkKycReviewResult>({
      method: 'POST',
      url: '/api/v1/admin/kyc/bulk-review',
      data: reviewData,
    });
  }

  // Get KYC provider statistics
  static async getKycProviderStats(): Promise<Record<string, unknown>> {
    return apiRequest<Record<string, unknown>>({
      method: 'GET',
      url: '/api/v1/admin/kyc/providers/stats',
    });
  }

  // Request re-verification for a user
  static async requestReVerification(userId: string, reason: string): Promise<KycVerification> {
    return apiRequest<KycVerification>({
      method: 'POST',
      url: `/api/v1/admin/kyc/users/${userId}/re-verify`,
      data: { reason },
    });
  }

  // Get KYC verification history for a user
  static async getKycHistoryByUserId(userId: string): Promise<KycVerification[]> {
    return apiRequest<KycVerification[]>({
      method: 'GET',
      url: `/api/v1/admin/kyc/users/${userId}/history`,
    });
  }
}

export default KycVerificationService;
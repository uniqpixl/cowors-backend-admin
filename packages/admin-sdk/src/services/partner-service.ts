import { BaseApiClient } from '../client/base-client';

/**
 * Admin Partner Service
 * Provides access to partner management operations
 */
export class AdminPartnerService {
  constructor(private client: BaseApiClient) {}

  // TODO: Implement partner management methods
  async getPartners(): Promise<any[]> {
    return this.client.get('/admin/partners');
  }
}
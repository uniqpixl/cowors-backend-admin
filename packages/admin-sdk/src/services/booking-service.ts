import { BaseApiClient } from '../client/base-client';

/**
 * Admin Booking Service
 * Provides access to booking management operations
 */
export class AdminBookingService {
  constructor(private client: BaseApiClient) {}

  // TODO: Implement booking management methods
  async getBookings(): Promise<any[]> {
    return this.client.get('/admin/bookings');
  }
}
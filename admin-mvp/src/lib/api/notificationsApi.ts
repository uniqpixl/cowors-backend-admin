import { apiClient } from './client';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'user' | 'booking' | 'partner';
  isActive: boolean;
  lastModified: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  emailProvider: string;
  smsProvider: string;
  defaultFromEmail: string;
  defaultFromName: string;
  lastUpdated?: string;
}

export interface TestEmailRequest {
  email: string;
  templateId: string;
}

// Get all email templates
export const getEmailTemplates = async (): Promise<EmailTemplate[]> => {
  const response = await apiClient.get('/admin/settings/notifications/templates');
  return response.data.templates;
};

// Update email template
export const updateEmailTemplate = async (
  templateId: string,
  templateData: Partial<EmailTemplate>
): Promise<EmailTemplate> => {
  const response = await apiClient.put(
    `/admin/settings/notifications/templates/${templateId}`,
    templateData
  );
  return response.data.template;
};

// Send test email
export const sendTestEmail = async (data: TestEmailRequest): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post('/admin/settings/notifications/test-send', data);
  return response.data;
};

// Get notification settings
export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  const response = await apiClient.get('/admin/settings/notifications/settings');
  return response.data.settings;
};

// Update notification settings
export const updateNotificationSettings = async (
  settings: Partial<NotificationSettings>
): Promise<NotificationSettings> => {
  const response = await apiClient.put('/admin/settings/notifications/settings', settings);
  return response.data.settings;
};
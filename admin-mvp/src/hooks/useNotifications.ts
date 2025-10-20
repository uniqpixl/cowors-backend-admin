import { useState, useEffect } from 'react';
import {
  getEmailTemplates,
  updateEmailTemplate,
  sendTestEmail,
  getNotificationSettings,
  updateNotificationSettings,
  EmailTemplate,
  NotificationSettings,
  TestEmailRequest
} from '../lib/api/notificationsApi';

// Hook for email templates
export const useEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEmailTemplates();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates
  };
};

// Hook for updating email templates
export const useUpdateEmailTemplate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTemplate = async (templateId: string, templateData: Partial<EmailTemplate>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedTemplate = await updateEmailTemplate(templateId, templateData);
      return updatedTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update template';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    updateTemplate,
    loading,
    error
  };
};

// Hook for sending test emails
export const useSendTestEmail = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendTest = async (data: TestEmailRequest) => {
    try {
      setLoading(true);
      setError(null);
      const result = await sendTestEmail(data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send test email';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    sendTest,
    loading,
    error
  };
};

// Hook for notification settings
export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotificationSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notification settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings
  };
};

// Hook for updating notification settings
export const useUpdateNotificationSettings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSettings = async (settingsData: Partial<NotificationSettings>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedSettings = await updateNotificationSettings(settingsData);
      return updatedSettings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update notification settings';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    updateSettings,
    loading,
    error
  };
};
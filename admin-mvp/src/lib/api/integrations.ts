import { ApiResponse } from './types';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  status: 'active' | 'inactive';
  lastUsed: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  lastTriggered: string | null;
  successRate: number;
  createdAt: string;
}

export interface ThirdPartyIntegration {
  id: string;
  name: string;
  type: 'payment' | 'email' | 'sms' | 'analytics';
  status: 'connected' | 'disconnected';
  description: string;
  configuredAt: string | null;
  lastSync: string | null;
  settings: Record<string, any>;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions: string[];
  expiresAt: string;
}

export interface CreateWebhookRequest {
  name: string;
  url: string;
  events: string[];
}

export interface ConnectIntegrationRequest {
  settings: Record<string, any>;
}

// API Keys
export async function getApiKeys(): Promise<ApiResponse<{ apiKeys: ApiKey[] }>> {
  const response = await fetch('/api/v1/admin/settings/integrations/api-keys');
  if (!response.ok) {
    throw new Error('Failed to fetch API keys');
  }
  return response.json();
}

export async function createApiKey(data: CreateApiKeyRequest): Promise<ApiResponse<ApiKey>> {
  const response = await fetch('/api/v1/admin/settings/integrations/api-keys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create API key');
  }
  return response.json();
}

export async function deleteApiKey(keyId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
  const response = await fetch(`/api/v1/admin/settings/integrations/api-keys/${keyId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete API key');
  }
  return response.json();
}

// Webhooks
export async function getWebhooks(): Promise<ApiResponse<{ webhooks: Webhook[] }>> {
  const response = await fetch('/api/v1/admin/settings/integrations/webhooks');
  if (!response.ok) {
    throw new Error('Failed to fetch webhooks');
  }
  return response.json();
}

export async function createWebhook(data: CreateWebhookRequest): Promise<ApiResponse<Webhook>> {
  const response = await fetch('/api/v1/admin/settings/integrations/webhooks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create webhook');
  }
  return response.json();
}

export async function deleteWebhook(webhookId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
  const response = await fetch(`/api/v1/admin/settings/integrations/webhooks/${webhookId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete webhook');
  }
  return response.json();
}

// Third-party integrations
export async function getThirdPartyIntegrations(): Promise<ApiResponse<{ integrations: ThirdPartyIntegration[] }>> {
  const response = await fetch('/api/v1/admin/settings/integrations/third-party');
  if (!response.ok) {
    throw new Error('Failed to fetch third-party integrations');
  }
  return response.json();
}

export async function connectIntegration(
  integrationId: string,
  data: ConnectIntegrationRequest
): Promise<ApiResponse<{ success: boolean; message: string; configuredAt: string; settings: Record<string, any> }>> {
  const response = await fetch(`/api/v1/admin/settings/integrations/third-party/${integrationId}/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to connect integration');
  }
  return response.json();
}

export async function disconnectIntegration(
  integrationId: string
): Promise<ApiResponse<{ success: boolean; message: string }>> {
  const response = await fetch(`/api/v1/admin/settings/integrations/third-party/${integrationId}/disconnect`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to disconnect integration');
  }
  return response.json();
}
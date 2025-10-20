import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getApiKeys,
  getWebhooks,
  getThirdPartyIntegrations,
  createApiKey,
  createWebhook,
  deleteApiKey,
  deleteWebhook,
  connectIntegration,
  disconnectIntegration,
  type ApiKey,
  type Webhook,
  type ThirdPartyIntegration,
  type CreateApiKeyRequest,
  type CreateWebhookRequest,
  type ConnectIntegrationRequest,
} from '../lib/api/integrations';
import { toast } from 'sonner';

// API Keys hooks
export function useApiKeys() {
  return useQuery({
    queryKey: ['apiKeys'],
    queryFn: async () => {
      const response = await getApiKeys();
      return response.data.apiKeys;
    },
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast.success('API key created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create API key');
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast.success('API key deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete API key');
    },
  });
}

// Webhooks hooks
export function useWebhooks() {
  return useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const response = await getWebhooks();
      return response.data.webhooks;
    },
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create webhook');
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete webhook');
    },
  });
}

// Third-party integrations hooks
export function useThirdPartyIntegrations() {
  return useQuery({
    queryKey: ['thirdPartyIntegrations'],
    queryFn: async () => {
      const response = await getThirdPartyIntegrations();
      return response.data.integrations;
    },
  });
}

export function useConnectIntegration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ integrationId, data }: { integrationId: string; data: ConnectIntegrationRequest }) =>
      connectIntegration(integrationId, data),
    onSuccess: (_, { integrationId }) => {
      queryClient.invalidateQueries({ queryKey: ['thirdPartyIntegrations'] });
      toast.success(`Integration connected successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to connect integration');
    },
  });
}

export function useDisconnectIntegration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: disconnectIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thirdPartyIntegrations'] });
      toast.success('Integration disconnected successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to disconnect integration');
    },
  });
}

// Combined hook for all integration data
export function useIntegrationsData() {
  const apiKeysQuery = useApiKeys();
  const webhooksQuery = useWebhooks();
  const integrationsQuery = useThirdPartyIntegrations();

  return {
    apiKeys: apiKeysQuery.data || [],
    webhooks: webhooksQuery.data || [],
    thirdPartyIntegrations: integrationsQuery.data || [],
    isLoading: apiKeysQuery.isLoading || webhooksQuery.isLoading || integrationsQuery.isLoading,
    error: apiKeysQuery.error || webhooksQuery.error || integrationsQuery.error,
  };
}
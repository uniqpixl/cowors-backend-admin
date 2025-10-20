'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button/Button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/ui';
import Label from '@/components/form/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Key, Webhook, Settings, Eye, EyeOff, Copy, Trash2, Plus, CheckCircle, XCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import {
  useIntegrationsData,
  useCreateApiKey,
  useDeleteApiKey,
  useCreateWebhook,
  useDeleteWebhook,
  useConnectIntegration,
  useDisconnectIntegration,
} from '@/hooks/useIntegrations';
import { toast } from 'sonner';

interface ApiKey {
  id: string
  name: string
  key: string
  permissions: string[]
  createdAt: string
  lastUsed: string | null
  status: 'active' | 'inactive'
  expiresAt: string
}

interface WebhookEndpoint {
  id: string
  name: string
  url: string
  events: string[]
  status: 'active' | 'inactive'
  lastTriggered: string | null
  successRate: number
  createdAt: string
}

interface ThirdPartyIntegration {
  id: string
  name: string
  type: 'payment' | 'email' | 'sms' | 'analytics'
  status: 'connected' | 'disconnected'
  description: string
  configuredAt: string | null
  lastSync: string | null
  settings: Record<string, any>
}

export default function IntegrationsContent() {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false)
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false)
  const [newApiKey, setNewApiKey] = useState({ name: '', permissions: [] as string[], expiresAt: '' })
  const [newWebhook, setNewWebhook] = useState({ name: '', url: '', events: [] as string[] })

  // Use API hooks
  const { apiKeys, webhooks, thirdPartyIntegrations, isLoading, error } = useIntegrationsData()
  const createApiKeyMutation = useCreateApiKey()
  const deleteApiKeyMutation = useDeleteApiKey()
  const createWebhookMutation = useCreateWebhook()
  const deleteWebhookMutation = useDeleteWebhook()
  const connectIntegrationMutation = useConnectIntegration()
  const disconnectIntegrationMutation = useDisconnectIntegration()

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading integrations...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <span className="ml-2 text-red-500">Failed to load integrations</span>
      </div>
    )
  }

  // Use data from API or fallback to empty arrays
  const currentApiKeys = apiKeys || []
  const currentWebhooks = webhooks || []
  const currentIntegrations = thirdPartyIntegrations || []

  const permissionOptions = [
    { value: 'read', label: 'Read' },
    { value: 'write', label: 'Write' },
    { value: 'admin', label: 'Admin' }
  ]

  const eventOptions = [
    { value: 'booking.created', label: 'Booking Created' },
    { value: 'booking.cancelled', label: 'Booking Cancelled' },
    { value: 'booking.updated', label: 'Booking Updated' },
    { value: 'payment.completed', label: 'Payment Completed' },
    { value: 'payment.failed', label: 'Payment Failed' },
    { value: 'user.created', label: 'User Created' },
    { value: 'user.updated', label: 'User Updated' }
  ]

  const getStatusColor = (status: string) => {
    const colors: Record<string, "primary" | "success" | "error" | "warning" | "info" | "light" | "dark"> = {
      active: "success",
      inactive: "light",
      failed: "error",
      error: "error",
      connected: "success",
      disconnected: "light"
    }
    return colors[status] || "light"
  }

  const toggleApiKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev)
      if (newSet.has(keyId)) {
        newSet.delete(keyId)
      } else {
        newSet.add(keyId)
      }
      return newSet
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleCreateApiKey = async () => {
    if (!newApiKey.name || newApiKey.permissions.length === 0) {
      toast.error('Please fill in all required fields')
      return
    }
    
    try {
      await createApiKeyMutation.mutateAsync({
        name: newApiKey.name,
        permissions: newApiKey.permissions,
        expiresAt: newApiKey.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // Default 1 year
      })
      setIsApiKeyModalOpen(false)
      setNewApiKey({ name: '', permissions: [], expiresAt: '' })
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleCreateWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0) {
      toast.error('Please fill in all required fields')
      return
    }
    
    try {
      await createWebhookMutation.mutateAsync({
        name: newWebhook.name,
        url: newWebhook.url,
        events: newWebhook.events
      })
      setIsWebhookModalOpen(false)
      setNewWebhook({ name: '', url: '', events: [] })
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleDeleteApiKey = async (keyId: string) => {
    try {
      await deleteApiKeyMutation.mutateAsync(keyId)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      await deleteWebhookMutation.mutateAsync(webhookId)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleConnectIntegration = async (integrationId: string, settings: Record<string, any>) => {
    try {
      await connectIntegrationMutation.mutateAsync({ integrationId, data: { settings } })
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleDisconnectIntegration = async (integrationId: string) => {
    try {
      await disconnectIntegrationMutation.mutateAsync(integrationId)
    } catch (error) {
      // Error handled by mutation
    }
  }

  return (
    <div className="space-y-8">
      {/* API Keys Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">API Keys</h3>
            <p className="text-sm text-gray-600 mt-1">Manage API keys for external integrations</p>
          </div>
          <Button
            onClick={() => setIsApiKeyModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create API Key
          </Button>
        </div>

        <div className="space-y-4">
          {currentApiKeys.map((apiKey: ApiKey) => (
            <div key={apiKey.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <Key className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{apiKey.name}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {visibleKeys.has(apiKey.id) ? apiKey.key : '••••••••••••••••'}
                    </code>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => toggleApiKeyVisibility(apiKey.id)}
                    >
                      {visibleKeys.has(apiKey.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>

                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(apiKey.key)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span>Permissions: {apiKey.permissions.join(', ')}</span>
                    <span>Last used: {apiKey.lastUsed}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge color={getStatusColor(apiKey.status)}>
                  {apiKey.status}
                </Badge>
                <Button size="sm" variant="outline">
                  <Settings className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteApiKey(apiKey.id)}
                  disabled={deleteApiKeyMutation.isPending}
                >
                  {deleteApiKeyMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Webhooks Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Webhooks</h3>
            <p className="text-sm text-gray-600 mt-1">Configure webhook endpoints for real-time notifications</p>
          </div>
          <Button
            onClick={() => setIsWebhookModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Webhook
          </Button>
        </div>

        <div className="space-y-4">
          {currentWebhooks.map((webhook: WebhookEndpoint) => (
            <div key={webhook.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <Webhook className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{webhook.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{webhook.url}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span>Events: {webhook.events.join(', ')}</span>
                    <span>Last triggered: {webhook.lastTriggered || 'Never'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge color={getStatusColor(webhook.status)}>
                  {webhook.status}
                </Badge>
                <Button size="sm" variant="outline">
                  <Settings className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteWebhook(webhook.id)}
                  disabled={deleteWebhookMutation.isPending}
                >
                  {deleteWebhookMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Third-Party Integrations Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Third-Party Integrations</h3>
            <p className="text-sm text-gray-600 mt-1">Connect with external services and platforms</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentIntegrations.map((integration: ThirdPartyIntegration) => (
            <div key={integration.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Settings className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{integration.name}</h4>
                    <p className="text-sm text-gray-600">{integration.type}</p>
                    <p className="text-sm text-gray-500 mt-1">{integration.description}</p>
                  </div>
                </div>
                <Badge color={getStatusColor(integration.status)}>
                  {integration.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-4">
                <Button size="sm" variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Configure
                </Button>
                {integration.status === 'connected' ? (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDisconnectIntegration(integration.id)}
                    disabled={disconnectIntegrationMutation.isPending}
                  >
                    {disconnectIntegrationMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Disconnect
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleConnectIntegration(integration.id, {})}
                    disabled={connectIntegrationMutation.isPending}
                  >
                    {connectIntegrationMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Connect
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Key Modal */}
      <Dialog open={isApiKeyModalOpen} onOpenChange={setIsApiKeyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKeyName">API Key Name</Label>
              <Input
                id="apiKeyName"
                value={newApiKey.name}
                onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter API key name"
              />
            </div>
            <div>
              <Label htmlFor="permissions">Permissions</Label>
              <div className="space-y-2">
                {permissionOptions.map((permission) => (
                  <div key={permission.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={permission.value}
                      checked={newApiKey.permissions.includes(permission.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewApiKey(prev => ({ ...prev, permissions: [...prev.permissions, permission.value] }))
                        } else {
                          setNewApiKey(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== permission.value) }))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={permission.value}>{permission.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApiKeyModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateApiKey} 
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={createApiKeyMutation.isPending}
            >
              {createApiKeyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create API Key'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Webhook Modal */}
      <Dialog open={isWebhookModalOpen} onOpenChange={setIsWebhookModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhookName">Webhook Name</Label>
              <Input
                id="webhookName"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter webhook name"
              />
            </div>
            <div>
              <Label htmlFor="webhookUrl">Endpoint URL</Label>
              <Input
                id="webhookUrl"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://your-domain.com/webhook"
              />
            </div>
            <div>
              <Label htmlFor="events">Events</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {eventOptions.map((event) => (
                  <div key={event.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={event.value}
                      checked={newWebhook.events.includes(event.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewWebhook(prev => ({ ...prev, events: [...prev.events, event.value] }))
                        } else {
                          setNewWebhook(prev => ({ ...prev, events: prev.events.filter(ev => ev !== event.value) }))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={event.value}>{event.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWebhookModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateWebhook} 
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={createWebhookMutation.isPending}
            >
              {createWebhookMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Add Webhook'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
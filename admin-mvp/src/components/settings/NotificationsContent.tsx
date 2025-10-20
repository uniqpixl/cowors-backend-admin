"use client";
import React, { useState, useEffect } from "react";
import Button from "@/components/ui/button/Button";
// Using native HTML input and label elements
// import { Dropdown } from "@/components/ui/dropdown/Dropdown";
// import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
// Card components replaced with styled divs
import { Mail, Send, Eye, Save, Copy, Plus, Settings, Bell, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useEmailTemplates,
  useUpdateEmailTemplate,
  useSendTestEmail,
  useNotificationSettings,
  useUpdateNotificationSettings
} from '../../hooks/useNotifications';
import { EmailTemplate } from '../../lib/api/notificationsApi';

// Component now uses API data exclusively

const templateTypes = [
  { value: "booking", label: "Booking Confirmation", icon: "📅" },
  { value: "refund", label: "Refund Notification", icon: "💰" },
  { value: "payout", label: "Partner Payout", icon: "🏦" },
  { value: "welcome", label: "Welcome Email", icon: "👋" },
  { value: "reminder", label: "Reminder", icon: "⏰" }
];

export default function NotificationsContent() {
  // API hooks
  const { templates, loading: templatesLoading, error: templatesError, refetch: refetchTemplates } = useEmailTemplates();
  const { updateTemplate, loading: updateLoading } = useUpdateEmailTemplate();
  const { sendTest, loading: testLoading } = useSendTestEmail();
  const { settings, loading: settingsLoading, refetch: refetchSettings } = useNotificationSettings();
  const { updateSettings, loading: updateSettingsLoading } = useUpdateNotificationSettings();

  // Local state
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [activeTab, setActiveTab] = useState("templates");

  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailProvider, setEmailProvider] = useState("sendgrid");
  const [smsProvider, setSmsProvider] = useState("twilio");
  const [defaultFromEmail, setDefaultFromEmail] = useState("noreply@cowors.com");
  const [defaultFromName, setDefaultFromName] = useState("Cowors Team");

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setEmailNotifications(settings.emailNotifications);
      setSmsNotifications(settings.smsNotifications);
      setPushNotifications(settings.pushNotifications);
      setEmailProvider(settings.emailProvider);
      setSmsProvider(settings.smsProvider);
      setDefaultFromEmail(settings.defaultFromEmail);
      setDefaultFromName(settings.defaultFromName);
    }
  }, [settings]);

  // Set first template as selected when templates are loaded
  useEffect(() => {
    if (templates && templates.length > 0 && !selectedTemplate) {
      setSelectedTemplate(templates[0]);
    }
  }, [templates, selectedTemplate]);

  const isLoading = updateLoading || testLoading || updateSettingsLoading;

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      await updateTemplate(selectedTemplate.id, {
        name: selectedTemplate.name,
        subject: selectedTemplate.subject,
        content: selectedTemplate.content,
        isActive: selectedTemplate.isActive
      });
      
      await refetchTemplates();
      setIsEditing(false);
      toast.success("Template saved successfully!");
    } catch (error) {
      toast.error("Failed to save template");
    }
  };

  const handleTestSend = async () => {
    if (!testEmail || !selectedTemplate) return;
    
    try {
      await sendTest({
        email: testEmail,
        templateId: selectedTemplate.id
      });
      toast.success(`Test email sent to ${testEmail}`);
      setShowTestDialog(false);
      setTestEmail("");
    } catch (error) {
      toast.error("Failed to send test email");
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings({
        emailNotifications,
        smsNotifications,
        pushNotifications,
        emailProvider,
        smsProvider,
        defaultFromEmail,
        defaultFromName
      });
      
      await refetchSettings();
      toast.success("Notification settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save notification settings");
    }
  };

  const copyPlaceholder = (placeholder: string) => {
    navigator.clipboard.writeText(`{{${placeholder}}}`);
    toast.success(`Copied {{${placeholder}}} to clipboard`);
  };

  const insertPlaceholder = (placeholder: string) => {
    if (!selectedTemplate) return;
    
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + `{{${placeholder}}}` + after;
      
      setSelectedTemplate(prev => prev ? { ...prev, content: newText } : null);
      
      // Set cursor position after the inserted placeholder
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length + 4, start + placeholder.length + 4);
      }, 0);
    }
  };

  // Get placeholders based on template type
  const getPlaceholdersForTemplate = (template: EmailTemplate): string[] => {
    const commonPlaceholders = ['user_name', 'partner_name'];
    
    switch (template.type) {
      case 'booking':
        return [...commonPlaceholders, 'booking_id', 'space_name', 'booking_date', 'booking_time', 'amount', 'space_address'];
      case 'user':
        return [...commonPlaceholders, 'booking_id', 'refund_id', 'refund_amount', 'process_date'];
      case 'partner':
        return [...commonPlaceholders, 'payout_id', 'payout_amount', 'payout_period', 'bank_account'];
      default:
        return commonPlaceholders;
    }
  };

  const generatePreviewContent = (content: string) => {
    if (!selectedTemplate) return content;
    
    let preview = content;
    const placeholders = getPlaceholdersForTemplate(selectedTemplate);
    
    placeholders.forEach(placeholder => {
      const sampleData: Record<string, string> = {
        user_name: "John Doe",
        partner_name: "ABC Coworking",
        booking_id: "BK001234",
        refund_id: "RF001234",
        payout_id: "PO001234",
        space_name: "Premium Meeting Room",
        booking_date: "2024-01-20",
        booking_time: "10:00 AM - 12:00 PM",
        amount: "₹2,500",
        refund_amount: "₹2,500",
        payout_amount: "₹15,000",
        space_address: "123 Business District, Mumbai",
        process_date: "2024-01-15",
        payout_period: "Jan 1-15, 2024",
        bank_account: "****1234"
      };
      
      preview = preview.replace(
        new RegExp(`{{${placeholder}}}`, 'g'),
        sampleData[placeholder] || `[${placeholder}]`
      );
    });
    
    return preview;
  };

  if (templatesLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading notifications...</span>
      </div>
    );
  }

  if (templatesError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading templates: {templatesError}</p>
        <Button onClick={refetchTemplates} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Manage email templates and notification settings</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => setShowTestDialog(true)}
          >
            <Send className="w-4 h-4 mr-2" />
            Test Send
          </Button>
          
          {showTestDialog && (
            <Modal
              isOpen={showTestDialog}
              onClose={() => setShowTestDialog(false)}

            >
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Send a test email with sample data to verify the template
                </p>
                <div>
                  <label htmlFor="testEmail" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    id="testEmail"
                    type="email"
                    placeholder="Enter test email address"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                  <p className="text-sm text-gray-600">{selectedTemplate?.name}</p>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowTestDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleTestSend} 
                    disabled={!testEmail || testLoading}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {testLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Test"
                    )}
                  </Button>
                </div>
              </div>
            </Modal>
          )}
          
          {isEditing && (
            <Button onClick={handleSaveTemplate} disabled={updateLoading} className="bg-red-600 hover:bg-red-700">
              {updateLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template List */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm lg:col-span-1">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Templates
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Customize email templates sent to users and partners
            </p>
          </div>
          <div className="p-6 space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id
                    ? "bg-red-50 border-2 border-red-200"
                    : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                }`}
                onClick={() => {
                  setSelectedTemplate(template);
                  setIsEditing(false);
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-sm">{template.name}</h3>
                  <Badge variant={template.isActive ? "solid" : "light"} color={template.isActive ? "success" : "light"}>
                    {template.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">{templateTypes.find(t => t.value === template.type)?.label}</p>
                <p className="text-xs text-gray-500 mt-1">Modified: {template.lastModified}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Template Editor */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm lg:col-span-2">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {selectedTemplate?.name || "Select Template"}
              </h3>
              {selectedTemplate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              )}
            </div>
          </div>
          <div className="p-6 space-y-4">
            {selectedTemplate ? (
              <>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                  <input
                    id="subject"
                    type="text"
                    value={selectedTemplate.subject}
                    onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, subject: e.target.value } : null)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="template-content" className="block text-sm font-medium text-gray-700 mb-1">Email Content</label>
                  <textarea
                    id="template-content"
                    value={selectedTemplate.content}
                    onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, content: e.target.value } : null)}
                    disabled={!isEditing}
                    rows={12}
                    className="w-full font-mono text-sm p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="light" color="info">
                    {templateTypes.find(t => t.value === selectedTemplate.type)?.icon}
                    {templateTypes.find(t => t.value === selectedTemplate.type)?.label}
                  </Badge>
                  <Badge variant={selectedTemplate.isActive ? "solid" : "light"} color={selectedTemplate.isActive ? "success" : "light"}>
                    {selectedTemplate.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select a template to edit</p>
              </div>
            )}
          </div>
        </div>

        {/* Placeholders & Preview */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm lg:col-span-1">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Placeholders
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Available placeholders for this template
            </p>
          </div>
          <div className="p-6 space-y-4">
            {selectedTemplate ? (
              <>
                <div className="space-y-2">
                  {getPlaceholdersForTemplate(selectedTemplate).map((placeholder) => (
                    <div key={placeholder} className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-gray-100 px-2 py-1 rounded">
                        {`{{${placeholder}}}`}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyPlaceholder(placeholder)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      {isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => insertPlaceholder(placeholder)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-200 my-4" />
                
                <div>
                  <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                    <Eye className="w-4 h-4" />
                    Preview
                  </label>
                  <div className="text-xs bg-gray-50 p-3 rounded border max-h-40 overflow-y-auto">
                    <div className="font-medium mb-2">Subject: {generatePreviewContent(selectedTemplate.subject)}</div>
                <div className="whitespace-pre-wrap">{generatePreviewContent(selectedTemplate.content)}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Settings className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Select a template to view placeholders</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Configure global notification preferences
              </p>
            </div>
            <Button 
              onClick={handleSaveSettings} 
              disabled={settingsLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {settingsLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium">SMTP Configuration</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Provider</label>
                  <select
                    value={emailProvider}
                    onChange={(e) => setEmailProvider(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="sendgrid">SendGrid</option>
                    <option value="mailgun">Mailgun</option>
                    <option value="smtp">SMTP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Address</label>
                  <input
                    type="email"
                    value={defaultFromEmail}
                    onChange={(e) => setDefaultFromEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                  <input
                    type="text"
                    value={defaultFromName}
                    onChange={(e) => setDefaultFromName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Notification Preferences</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">SMS Notifications</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smsNotifications}
                      onChange={(e) => setSmsNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Push Notifications</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pushNotifications}
                      onChange={(e) => setPushNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h3 className="font-medium">Delivery Stats (Last 30 days)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Emails Sent:</span>
                    <span className="font-medium">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivered:</span>
                    <span className="text-green-600 font-medium">1,198 (96%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed:</span>
                    <span className="text-red-600 font-medium">49 (4%)</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium">Template Usage</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Booking Confirmations:</span>
                    <span className="font-medium">856</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Refund Notifications:</span>
                    <span className="font-medium">123</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Partner Payouts:</span>
                    <span className="font-medium">268</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium">Connection Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>SMTP Status:</span>
                    <Badge variant="light" color="success">Connected</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Test:</span>
                    <span className="text-gray-600">2 hours ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span className="text-green-600 font-medium">99.8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
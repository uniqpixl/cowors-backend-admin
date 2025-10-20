'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/button/Button'
import Input from '@/components/form/input/InputField'
import Label from '@/components/form/Label'
import Badge from '@/components/ui/badge/Badge'
import { Modal } from '@/components/ui'
import { User, Mail, Phone, MapPin, Bell, Palette, Globe, Shield, Camera, Save, Loader2, AlertCircle } from 'lucide-react'
import {
  useAdminProfile,
  useUpdateAdminProfile,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useAppearanceSettings,
  useUpdateAppearanceSettings,
  useChangePassword,
  useUploadAvatar
} from '@/hooks/useSettings'
import type { AdminProfile, NotificationPreferences, AppearanceSettings } from '@/lib/api/types'

export default function ProfileSettingsContent() {
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // API hooks
  const { data: profileData, isLoading: profileLoading, error: profileError } = useAdminProfile()
  const { data: notifications, isLoading: notificationsLoading, error: notificationsError } = useNotificationPreferences()
  const { data: appearance, isLoading: appearanceLoading, error: appearanceError } = useAppearanceSettings()
  
  const updateProfileMutation = useUpdateAdminProfile()
  const updateNotificationsMutation = useUpdateNotificationPreferences()
  const updateAppearanceMutation = useUpdateAppearanceSettings()
  const changePasswordMutation = useChangePassword()
  const uploadAvatarMutation = useUploadAvatar()

  // Local state for form data
  const [localProfileData, setLocalProfileData] = useState<Partial<AdminProfile>>({})
  const [localNotifications, setLocalNotifications] = useState<Partial<NotificationPreferences>>({})
  const [localAppearance, setLocalAppearance] = useState<Partial<AppearanceSettings>>({})

  // Update local state when API data loads
  useEffect(() => {
    if (profileData) {
      setLocalProfileData(profileData)
    }
  }, [profileData])

  useEffect(() => {
    if (notifications) {
      setLocalNotifications(notifications)
    }
  }, [notifications])

  useEffect(() => {
    if (appearance) {
      setLocalAppearance(appearance)
    }
  }, [appearance])

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' }
  ]

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' }
  ]

  const timezoneOptions = [
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' }
  ]

  const dateFormatOptions = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
  ]

  const currencyOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD (C$)' }
  ]

  const handleProfileUpdate = () => {
    if (localProfileData) {
      updateProfileMutation.mutate(localProfileData as AdminProfile)
    }
  }

  const handleNotificationUpdate = () => {
    if (localNotifications) {
      updateNotificationsMutation.mutate(localNotifications as NotificationPreferences)
    }
  }

  const handleAppearanceUpdate = () => {
    if (localAppearance) {
      updateAppearanceMutation.mutate(localAppearance as AppearanceSettings)
    }
  }

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setIsPasswordModalOpen(false)
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
        }
      }
    )
  }

  const handleAvatarUpload = () => {
    if (selectedFile) {
      uploadAvatarMutation.mutate(
        selectedFile,
        {
          onSuccess: () => {
            setIsAvatarModalOpen(false)
            setSelectedFile(null)
          }
        }
      )
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  // Show loading state
  if (profileLoading || notificationsLoading || appearanceLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading settings...</span>
      </div>
    )
  }

  // Show error state
  if (profileError || notificationsError || appearanceError) {
    return (
      <div className="flex items-center justify-center py-12">
        <AlertCircle className="h-8 w-8 text-red-600" />
        <span className="ml-2 text-red-600">Failed to load settings</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Profile Information Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
            <p className="text-sm text-gray-600 mt-1">Update your personal information and profile details</p>
          </div>
          <Button
            onClick={handleProfileUpdate}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>

        <div className="flex items-start space-x-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <img
                src={localProfileData.avatar || '/avatars/default-avatar.jpg'}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <Button
                size="sm"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute -bottom-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2"
                disabled={uploadAvatarMutation.isPending}
              >
                {uploadAvatarMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Camera className="w-3 h-3" />
                )}
              </Button>
            </div>
            <Badge color="success">Administrator</Badge>
          </div>

          {/* Profile Form */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={localProfileData.firstName ?? ''}
                onChange={(e) => setLocalProfileData({ ...localProfileData, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={localProfileData.lastName ?? ''}
                onChange={(e) => setLocalProfileData({ ...localProfileData, lastName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={localProfileData.email ?? ''}
                  onChange={(e) => setLocalProfileData({ ...localProfileData, email: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="phone"
                  value={localProfileData.phone ?? ''}
                  onChange={(e) => setLocalProfileData({ ...localProfileData, phone: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={localProfileData.jobTitle ?? ''}
                onChange={(e) => setLocalProfileData({ ...localProfileData, jobTitle: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={localProfileData.department ?? ''}
                onChange={(e) => setLocalProfileData({ ...localProfileData, department: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="location"
                  value={localProfileData.location ?? ''}
                  onChange={(e) => setLocalProfileData({ ...localProfileData, location: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                value={localProfileData.bio ?? ''}
                onChange={(e) => setLocalProfileData({ ...localProfileData, bio: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsPasswordModalOpen(true)}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              <Shield className="h-4 w-4 mr-2" />
              Change Password
            </Button>
            <Button 
              onClick={handleProfileUpdate}
              disabled={updateProfileMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Notification Preferences Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
            <p className="text-sm text-gray-600 mt-1">Choose how you want to receive notifications</p>
          </div>
          <Button 
            onClick={handleNotificationUpdate}
            disabled={updateNotificationsMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {updateNotificationsMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Preferences
          </Button>
        </div>

        <div className="space-y-4">
          {Object.entries(localNotifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </p>
                  <p className="text-sm text-gray-600">
                    {key === 'emailNotifications' && 'Receive notifications via email'}
                    {key === 'pushNotifications' && 'Receive push notifications in browser'}
                    {key === 'smsNotifications' && 'Receive SMS notifications for urgent alerts'}
                    {key === 'weeklyReports' && 'Get weekly summary reports'}
                    {key === 'securityAlerts' && 'Important security and login alerts'}
                    {key === 'marketingEmails' && 'Product updates and marketing communications'}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => setLocalNotifications({ ...localNotifications, [key]: e.target.checked })}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Appearance Settings Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Appearance &amp; Localization</h3>
            <p className="text-sm text-gray-600 mt-1">Customize your interface and regional settings</p>
          </div>
          <Button
            onClick={handleAppearanceUpdate}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="theme">Theme</Label>
            <div className="relative">
              <Palette className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <select
                value={localAppearance.theme}
                onChange={(e) => setLocalAppearance({ ...localAppearance, theme: e.target.value as 'light' | 'dark' | 'system' })}
                className="h-11 w-full rounded-lg border border-gray-300 pl-10 px-4 py-2.5 text-sm focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300"
              >
                {themeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="language">Language</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <select
                value={localAppearance.language}
                onChange={(e) => setLocalAppearance({ ...localAppearance, language: e.target.value })}
                className="h-11 w-full rounded-lg border border-gray-300 pl-10 px-4 py-2.5 text-sm focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <select
              value={localAppearance.timezone}
              onChange={(e) => setLocalAppearance({ ...localAppearance, timezone: e.target.value })}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300"
            >
              {timezoneOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="dateFormat">Date Format</Label>
            <select
              value={localAppearance.dateFormat}
              onChange={(e) => setLocalAppearance({ ...localAppearance, dateFormat: e.target.value })}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300"
            >
              {dateFormatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <select
              value={localAppearance.currency}
              onChange={(e) => setLocalAppearance({ ...localAppearance, currency: e.target.value })}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300"
            >
              {currencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Avatar Upload Modal */}
      <Modal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Profile Picture</h3>
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {selectedFile ? (
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsAvatarModalOpen(false)
                setSelectedFile(null)
              }}
              disabled={uploadAvatarMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAvatarUpload}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!selectedFile || uploadAvatarMutation.isPending}
            >
              {uploadAvatarMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Upload Picture
            </Button>
          </div>
        </div>
      </Modal>

      {/* Password Change Modal */}
      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsPasswordModalOpen(false)}
              disabled={changePasswordMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePasswordChange} 
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Change Password
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
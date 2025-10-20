"use client";
import React from "react";
import Image from "next/image";
import Badge from '@/components/ui/badge/Badge'
import Button from '@/components/ui/button/Button'
import { TimeIcon } from '@/icons'
import { useModal } from '@/hooks/useModal'
import { Modal } from '@/components/ui'
import ActivityLog from '@/components/user-profile/ActivityLog'
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { useAdminUser } from '@/hooks/useAdminUsers';
import { formatDate, formatUserId } from "@/utils/formatters";

interface UserMetaCardAdminProps {
  userId: string;
}

export default function UserMetaCardAdmin({ userId }: UserMetaCardAdminProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const { data: user, isLoading, error } = useAdminUser(userId);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm w-full max-w-full overflow-hidden">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-gray-200 rounded-full mb-3 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-1 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex justify-between items-center">
              <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm w-full max-w-full overflow-hidden">
        <div className="text-center py-8">
          <p className="text-red-600 text-sm">Failed to load user data</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Name not provided';
  const isVerified = user.kycStatus === 'Verified';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm w-full max-w-full overflow-hidden">

      
      {/* User Avatar and Basic Info */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 overflow-hidden rounded-full border-2 border-gray-300 mb-3">
          <Image
            width={64}
            height={64}
            src={`/images/user/user-${(Math.floor(Math.random() * 10) + 1).toString().padStart(2, '0')}.jpg`}
            alt="user"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-gray-800 font-semibold text-lg">
            {fullName}
          </h4>
          {isVerified && (
            <VerifiedBadge 
              isVerified={isVerified} 
              size="sm" 
              className="flex-shrink-0"
            />
          )}
        </div>
        <p className="text-gray-600 text-sm">
          {user.email}
        </p>
        <p className="text-gray-600 text-sm">
          {user.phoneNumber || '+1 234 567 8900'}
        </p>
      </div>

      {/* User Information */}
      <div className="border-t border-gray-200 pt-4 mb-4">
        <div className="space-y-3">
          {/* Cowors ID */}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Cowors ID</span>
            <span className="text-gray-800 font-mono text-sm font-semibold">
              {formatUserId(userId)}
            </span>
          </div>
          
          {/* Account Status */}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Account Status</span>
            <Badge 
              variant="light" 
              color={user.status === 'Active' ? 'success' : 'warning'} 
              size="sm"
            >
              {user.status}
            </Badge>
          </div>
          
          {/* KYC Status */}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">KYC Status</span>
            <Badge 
              variant="light" 
              color={user.kycStatus === 'Verified' ? 'success' : 'warning'} 
              size="sm"
            >
              {user.kycStatus}
            </Badge>
          </div>
          
          {/* Member Since */}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Member Since</span>
            <span className="text-gray-800 text-sm">{formatDate(user.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Activity Log Button */}
      <div className="border-t border-gray-200 pt-4">
        <Button
          variant="primary"
          size="md"
          startIcon={<TimeIcon />}
          onClick={openModal}
          className="w-full"
        >
          Activity Log
        </Button>
      </div>

      {/* Activity Log Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-4xl max-h-[90vh] mx-4 my-4 overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0 p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Activity Log</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <ActivityLog />
          </div>
        </div>
      </Modal>
    </div>
  );
}
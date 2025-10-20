"use client";
import React from "react";
import Image from "next/image";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { TimeIcon } from '@/icons'
import { useModal } from '@/hooks/useModal'
import { Modal } from '@/components/ui'
import PartnerActivityLogContent from '@/components/partner-profile/PartnerActivityLogContent'
import { usePartner } from '@/hooks/usePartners';
import { formatPartnerId } from "@/utils/formatters";


interface PartnerMetaCardAdminProps {
  partnerId: string;
}

export default function PartnerMetaCardAdmin({ partnerId }: PartnerMetaCardAdminProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const { data: partner, isLoading, error } = usePartner(partnerId);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm w-full max-w-full overflow-hidden">
        <div className="animate-pulse">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-gray-300 rounded-full mb-3"></div>
            <div className="h-6 bg-gray-300 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-48 mb-1"></div>
            <div className="h-4 bg-gray-300 rounded w-32"></div>
          </div>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
                <div className="h-4 bg-gray-300 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm w-full max-w-full overflow-hidden">
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">Failed to load partner data</p>
          <p className="text-gray-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm w-full max-w-full overflow-hidden">
        <div className="text-center py-8">
          <p className="text-gray-500">Partner not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm w-full max-w-full overflow-hidden">

      
      {/* Partner Avatar and Basic Info */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 overflow-hidden rounded-full border-2 border-gray-300 mb-3">
          <Image
            width={64}
            height={64}
            src="/images/user/owner.jpg"
            alt="partner"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-gray-800 font-semibold text-lg">
            {partner.businessName || partner.name}
          </h4>
          {partner.verificationStatus === 'Verified' && (
            <VerifiedBadge 
              isVerified={partner.verificationStatus === 'Verified'} 
              size="sm" 
              className="flex-shrink-0"
            />
          )}
        </div>
        <p className="text-gray-600 text-sm">
          {partner.email}
        </p>
        <p className="text-gray-600 text-sm">
          {partner.phoneNumber || 'N/A'}
        </p>
      </div>

      {/* Partner Information */}
      <div className="border-t border-gray-200 pt-4 mb-4">
        <div className="space-y-3">
          {/* Cowors Partner ID */}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Partner ID</span>
            <span className="text-gray-800 font-mono text-sm font-semibold">
              {formatPartnerId(partnerId)}
            </span>
          </div>
          
          {/* Account Status */}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Account Status</span>
            <Badge 
              variant="light" 
              color={partner.status === 'Active' ? 'success' : partner.status === 'Suspended' ? 'error' : 'warning'} 
              size="sm"
            >
              {partner.status ? partner.status.charAt(0).toUpperCase() + partner.status.slice(1) : 'Active'}
            </Badge>
          </div>
          
          {/* Verification Status */}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Verification Status</span>
            <Badge 
              variant="light" 
              color={partner.verificationStatus === 'Verified' ? 'success' : partner.verificationStatus === 'Rejected' ? 'error' : 'warning'} 
              size="sm"
            >
              {partner.verificationStatus ? partner.verificationStatus.charAt(0).toUpperCase() + partner.verificationStatus.slice(1) : 'Pending'}
            </Badge>
          </div>
          
          {/* Business Type */}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Business Type</span>
            <span className="text-gray-800 text-sm">{partner.businessType || 'N/A'}</span>
          </div>
          
          {/* Partner Since */}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Partner Since</span>
            <span className="text-gray-800 text-sm">
              {partner.createdAt ? new Date(partner.createdAt).toLocaleDateString('en-GB') : 'N/A'}
            </span>
          </div>
          
          {/* Space Name */}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Space Name</span>
            <span className="text-gray-800 text-sm font-semibold">{partner.businessName || partner.name || 'N/A'}</span>
          </div>
          
          {/* Space Type */}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Business Type</span>
            <span className="text-gray-800 text-sm">{partner.businessType || 'N/A'}</span>
          </div>
          
          {/* Space Rating */}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Rating</span>
            <span className="text-gray-800 text-sm font-semibold">
              {partner.averageRating ? `${partner.averageRating}/5` : 'N/A'}
              {partner.totalReviews ? ` (${partner.totalReviews} reviews)` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="border-t border-gray-200 pt-4">
        <div className="space-y-3">
          {/* Area/Locality */}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Address</span>
            <span className="text-gray-800 text-sm text-right">
              {partner.address || 'N/A'}
            </span>
          </div>
          
          {/* City/Postal Code */}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">City/Postal Code</span>
            <span className="text-gray-800 text-sm">
              {partner.city ? `${partner.city}${partner.zipCode ? `, ${partner.zipCode}` : ''}` : 'N/A'}
            </span>
          </div>
          
          {/* State */}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">State</span>
            <span className="text-gray-800 text-sm">{partner.state || 'N/A'}</span>
          </div>
          
          {/* Country */}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Country</span>
            <span className="text-gray-800 text-sm">India</span>
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
            <h2 className="text-xl font-semibold text-gray-800">Partner Activity Log</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <PartnerActivityLogContent />
          </div>
        </div>
      </Modal>
    </div>
  );
}
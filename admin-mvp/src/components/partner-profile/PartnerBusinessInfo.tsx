"use client";
import React from "react";
import { Building2, FileText, CreditCard, CheckCircle, Clock, XCircle, Shield } from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import { formatDate } from '@/utils/formatters';
import { usePartner } from '@/hooks/usePartners';

interface PartnerBusinessInfoProps {
  partnerId: string;
}

const PartnerBusinessInfo: React.FC<PartnerBusinessInfoProps> = ({ partnerId }) => {
  const { data: partner, isLoading, error } = usePartner(partnerId);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-32"></div>
                <div className="h-10 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm">
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">Failed to load business information</p>
          <p className="text-gray-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm">
        <div className="text-center py-8">
          <p className="text-gray-500">Partner not found</p>
        </div>
      </div>
    );
  }

  // Mock business info since it's not available in the current Partner interface
  const businessInfo = {
    gst: { status: 'pending', number: 'N/A' },
    fssai: { status: 'pending', licenseNumber: 'N/A', expiryDate: null },
    certifications: [] as Array<{ id: string; type: string; number: string; status: string; expiryDate: string | null }>,
    payoutMethods: [] as Array<{ id: string; type: string; accountNumber: string; bankName: string; upiId: string; status: string; isPrimary: boolean }>,
    businessRegistration: { type: 'N/A', number: 'N/A', registeredAt: null, status: 'pending' }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'valid':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
      case 'expiring':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'expired':
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getBadgeColor = (status: string): "primary" | "success" | "error" | "warning" | "info" | "light" | "dark" => {
    switch (status) {
      case 'verified':
      case 'valid':
      case 'active':
        return 'success';
      case 'pending':
      case 'expiring':
        return 'warning';
      case 'expired':
      case 'inactive':
        return 'error';
      default:
        return 'light';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gray-50 rounded-lg">
          <Building2 className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
          <p className="text-sm text-gray-500">Compliance and payout details</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* GST Information */}
        <div className="border-b border-gray-100 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-600" />
              GST Registration
            </h4>
            <div className="flex items-center gap-2">
              {getStatusIcon(businessInfo.gst?.status || 'pending')}
              <Badge size="sm" color={getBadgeColor(businessInfo.gst?.status || 'pending')}>
                {businessInfo.gst?.status || 'pending'}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            <span className="font-medium">GST Number:</span> {businessInfo.gst?.number || 'N/A'}
          </p>
        </div>

        {/* FSSAI License */}
        <div className="border-b border-gray-100 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-600" />
              FSSAI License
            </h4>
            <div className="flex items-center gap-2">
              {getStatusIcon(businessInfo.fssai?.status || 'pending')}
              <Badge size="sm" color={getBadgeColor(businessInfo.fssai?.status || 'pending')}>
                {businessInfo.fssai?.status || 'pending'}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium">License Number:</span> {businessInfo.fssai?.licenseNumber || 'N/A'}
          </p>
          {businessInfo.fssai?.expiryDate && (
            <p className="text-xs text-gray-500">
              Expires on {formatDate(businessInfo.fssai.expiryDate)}
            </p>
          )}
        </div>

        {/* Other Certifications */}
        <div className="border-b border-gray-100 pb-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-600" />
            Other Certifications
          </h4>
          <div className="space-y-3">
            {businessInfo.certifications && businessInfo.certifications.length > 0 ? (
              businessInfo.certifications.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">{cert.type}</p>
                      {getStatusIcon(cert.status)}
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">Number:</span> {cert.number}
                    </p>
                    {cert.expiryDate && (
                      <p className="text-xs text-gray-500">
                        Expires: {formatDate(cert.expiryDate)}
                      </p>
                    )}
                  </div>
                  <Badge size="sm" color={getBadgeColor(cert.status)}>
                    {cert.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">No certifications available</p>
              </div>
            )}
          </div>
        </div>

        {/* Payout Methods */}
        <div className="border-b border-gray-100 pb-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-600" />
            Payout Methods
          </h4>
          <div className="space-y-3">
            {businessInfo.payoutMethods && businessInfo.payoutMethods.length > 0 ? (
              businessInfo.payoutMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">{method.type}</p>
                      {method.isPrimary && (
                        <Badge size="sm" color="info">
                        Primary
                      </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {method.type === 'bank' ? (
                        <>
                          <span className="font-medium">Account:</span> ****{method.accountNumber?.slice(-4) || 'N/A'}
                          <span className="ml-3 font-medium">Bank:</span> {method.bankName || 'N/A'}
                        </>
                      ) : (
                        <>
                          <span className="font-medium">UPI ID:</span> {method.upiId || 'N/A'}
                        </>
                      )}
                    </p>
                  </div>
                  <Badge size="sm" color={getBadgeColor(method.status)}>
                    {method.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">No payout methods available</p>
              </div>
            )}
          </div>
        </div>

        {/* Business Registration */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-600" />
            Business Registration
          </h4>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">
                  {businessInfo.businessRegistration?.type || 'N/A'}
                </p>
                {getStatusIcon(businessInfo.businessRegistration?.status || 'pending')}
              </div>
              <Badge size="sm" color={getBadgeColor(businessInfo.businessRegistration?.status || 'pending')}>
                {businessInfo.businessRegistration?.status || 'pending'}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Registration Number:</span> {businessInfo.businessRegistration?.number || 'N/A'}
            </p>
            {businessInfo.businessRegistration?.registeredAt && (
              <p className="text-xs text-gray-500">
                Registered on {formatDate(businessInfo.businessRegistration.registeredAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerBusinessInfo;
// KycVerification.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Tailwind,
  Text,
  Img,
} from '@react-email/components';
import * as React from 'react';

interface KycVerificationProps {
  firstName: string;
  status: 'approved' | 'rejected' | 'pending' | 'required';
  verificationUrl?: string;
  rejectionReason?: string;
  documentsRequired?: string[];
  supportUrl: string;
}

export const KycVerification = ({
  firstName = '{{firstName}}',
  status = 'required' as any,
  verificationUrl = '{{verificationUrl}}',
  rejectionReason = '{{rejectionReason}}',
  documentsRequired = [],
  supportUrl = '{{supportUrl}}',
}: KycVerificationProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'approved':
        return {
          title: '✅ KYC Verification Approved',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          message: 'Congratulations! Your identity verification has been approved.',
        };
      case 'rejected':
        return {
          title: '❌ KYC Verification Rejected',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          message: 'Unfortunately, we were unable to verify your identity.',
        };
      case 'pending':
        return {
          title: '⏳ KYC Verification Under Review',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          message: 'Your documents are currently being reviewed.',
        };
      default:
        return {
          title: '📋 KYC Verification Required',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          message: 'Please complete your identity verification to continue.',
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Html>
      <Head />
      <Preview>KYC Verification Update - {statusConfig.title}</Preview>
      <Tailwind>
        <Body className="bg-[#f4f4f7] font-sans">
          <Container className="bg-white max-w-xl mx-auto p-6 rounded-lg">
            <div className="text-center mb-6">
              <Img
                src="https://cowors.com/logo.png"
                width="120"
                height="40"
                alt="Cowors"
                className="mx-auto"
              />
            </div>
            
            <div className={`${statusConfig.bgColor} ${statusConfig.borderColor} border rounded-lg p-4 mb-6`}>
              <Text className={`text-xl font-bold text-center ${statusConfig.textColor} mb-2`}>
                {statusConfig.title}
              </Text>
            </div>
            
            <Text className="text-lg font-semibold mb-4 text-gray-700">
              Hi {firstName},
            </Text>
            
            <Text className="text-base mb-6 text-gray-600">
              {statusConfig.message}
            </Text>
            
            {status === 'approved' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <Text className="text-sm font-semibold text-green-800 mb-2">
                  🎉 What's Next?
                </Text>
                <Text className="text-sm text-green-700 mb-1">
                  • You can now access all premium features
                </Text>
                <Text className="text-sm text-green-700 mb-1">
                  • Higher booking limits are now available
                </Text>
                <Text className="text-sm text-green-700">
                  • Priority customer support is activated
                </Text>
              </div>
            )}
            
            {status === 'rejected' && rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <Text className="text-sm font-semibold text-red-800 mb-2">
                  📝 Rejection Reason
                </Text>
                <Text className="text-sm text-red-700 mb-4">
                  {rejectionReason}
                </Text>
                <Text className="text-sm text-red-700">
                  You can resubmit your documents after addressing the issues mentioned above.
                </Text>
              </div>
            )}
            
            {status === 'required' && documentsRequired && documentsRequired.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <Text className="text-sm font-semibold text-blue-800 mb-2">
                  📄 Required Documents
                </Text>
                {documentsRequired.map((doc, index) => (
                  <Text key={index} className="text-sm text-blue-700 mb-1">
                    • {doc}
                  </Text>
                ))}
              </div>
            )}
            
            {status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <Text className="text-sm font-semibold text-yellow-800 mb-2">
                  ⏰ Review Timeline
                </Text>
                <Text className="text-sm text-yellow-700 mb-2">
                  Our verification team typically reviews documents within 1-3 business days.
                </Text>
                <Text className="text-sm text-yellow-700">
                  You'll receive an email notification once the review is complete.
                </Text>
              </div>
            )}
            
            {(status === 'required' || status === 'rejected') && verificationUrl && (
              <div className="text-center mb-6">
                <Button
                  href={verificationUrl}
                  className="bg-blue-600 text-white font-bold py-3 px-6 rounded-md no-underline inline-block"
                >
                  {status === 'rejected' ? 'Resubmit Documents' : 'Start Verification'}
                </Button>
              </div>
            )}
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <Text className="text-sm font-semibold text-gray-800 mb-2">
                🔒 Security & Privacy
              </Text>
              <Text className="text-sm text-gray-700 mb-2">
                Your personal information is encrypted and stored securely. We comply with all data protection regulations.
              </Text>
              <Text className="text-sm text-gray-700">
                Documents are only used for verification purposes and are not shared with third parties.
              </Text>
            </div>
            
            <Text className="text-sm text-gray-500 text-center mb-4">
              Questions about the verification process? Visit our{' '}
              <a href={supportUrl} className="text-blue-600 underline">
                Help Center
              </a>{' '}
              or contact support.
            </Text>
            
            <Text className="text-xs text-gray-400 text-center mt-6">
              © 2024 Cowors. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default KycVerification;
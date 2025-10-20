// PartnerApproval.tsx
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
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface PartnerApprovalProps {
  partnerName: string;
  businessName: string;
  status: 'approved' | 'rejected' | 'pending' | 'under_review';
  dashboardUrl?: string;
  rejectionReason?: string;
  nextSteps?: string[];
  supportUrl: string;
}

export const PartnerApproval = ({
  partnerName = '{{partnerName}}',
  businessName = '{{businessName}}',
  status = 'pending' as any,
  dashboardUrl = '{{dashboardUrl}}',
  rejectionReason = '{{rejectionReason}}',
  nextSteps = [],
  supportUrl = '{{supportUrl}}',
}: PartnerApprovalProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'approved':
        return {
          title: '🎉 Partner Application Approved!',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          message: 'Congratulations! Your partner application has been approved.',
        };
      case 'rejected':
        return {
          title: '❌ Partner Application Rejected',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          message: 'Unfortunately, we cannot approve your partner application at this time.',
        };
      case 'under_review':
        return {
          title: '🔍 Application Under Review',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          message: 'Your partner application is currently being reviewed by our team.',
        };
      default:
        return {
          title: '📋 Application Received',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          message: 'We have received your partner application.',
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Html>
      <Head />
      <Preview>Partner Application Update - {businessName}</Preview>
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
              <Text className="text-center text-gray-600">
                {businessName}
              </Text>
            </div>
            
            <Text className="text-lg font-semibold mb-4 text-gray-700">
              Hi {partnerName},
            </Text>
            
            <Text className="text-base mb-6 text-gray-600">
              {statusConfig.message}
            </Text>
            
            {status === 'approved' && (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <Text className="text-sm font-semibold text-green-800 mb-2">
                    🚀 Welcome to the Cowors Partner Network!
                  </Text>
                  <Text className="text-sm text-green-700 mb-2">
                    You can now start listing your workspaces and earning revenue through our platform.
                  </Text>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <Text className="text-sm font-semibold text-blue-800 mb-2">
                    📋 Next Steps
                  </Text>
                  <Text className="text-sm text-blue-700 mb-1">
                    • Complete your partner profile setup
                  </Text>
                  <Text className="text-sm text-blue-700 mb-1">
                    • Add your first workspace listing
                  </Text>
                  <Text className="text-sm text-blue-700 mb-1">
                    • Set up your payment preferences
                  </Text>
                  <Text className="text-sm text-blue-700">
                    • Review our partner guidelines and best practices
                  </Text>
                </div>
                
                {dashboardUrl && (
                  <div className="text-center mb-6">
                    <Button
                      href={dashboardUrl}
                      className="bg-blue-600 text-white font-bold py-3 px-6 rounded-md no-underline inline-block"
                    >
                      Access Partner Dashboard
                    </Button>
                  </div>
                )}
              </>
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
                  You may reapply after addressing the concerns mentioned above. 
                  Please contact our support team if you need clarification.
                </Text>
              </div>
            )}
            
            {(status === 'under_review' || status === 'pending') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <Text className="text-sm font-semibold text-yellow-800 mb-2">
                  ⏰ Review Process
                </Text>
                <Text className="text-sm text-yellow-700 mb-2">
                  Our team typically reviews partner applications within 3-5 business days.
                </Text>
                <Text className="text-sm text-yellow-700 mb-2">
                  We may contact you if we need additional information or documentation.
                </Text>
                <Text className="text-sm text-yellow-700">
                  You'll receive an email notification once the review is complete.
                </Text>
              </div>
            )}
            
            {nextSteps && nextSteps.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <Text className="text-sm font-semibold text-gray-800 mb-2">
                  📋 Additional Steps Required
                </Text>
                {nextSteps.map((step, index) => (
                  <Text key={index} className="text-sm text-gray-700 mb-1">
                    • {step}
                  </Text>
                ))}
              </div>
            )}
            
            <Hr className="my-6" />
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <Text className="text-sm font-semibold text-blue-800 mb-2">
                💼 Partner Benefits
              </Text>
              <Text className="text-sm text-blue-700 mb-1">
                • Competitive commission rates
              </Text>
              <Text className="text-sm text-blue-700 mb-1">
                • Marketing support and exposure
              </Text>
              <Text className="text-sm text-blue-700 mb-1">
                • Dedicated partner support team
              </Text>
              <Text className="text-sm text-blue-700">
                • Analytics and performance insights
              </Text>
            </div>
            
            <Text className="text-sm text-gray-500 text-center mb-4">
              Questions about your partnership? Visit our{' '}
              <a href={supportUrl} className="text-blue-600 underline">
                Partner Help Center
              </a>{' '}
              or contact our partner support team.
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

export default PartnerApproval;
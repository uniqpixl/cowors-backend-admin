// Welcome.tsx
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

interface WelcomeProps {
  firstName: string;
  email: string;
  dashboardUrl: string;
}

export const Welcome = ({
  firstName = '{{firstName}}',
  email = '{{email}}',
  dashboardUrl = '{{dashboardUrl}}',
}: WelcomeProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Cowors - Your workspace journey begins!</Preview>
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
            
            <Text className="text-2xl font-bold text-center mb-6 text-gray-800">
              Welcome to Cowors! 🎉
            </Text>
            
            <Text className="text-lg font-semibold mb-4 text-gray-700">
              Hi {firstName},
            </Text>
            
            <Text className="text-base mb-4 text-gray-600">
              Welcome to Cowors! We're thrilled to have you join our community of workspace seekers and providers.
            </Text>
            
            <Text className="text-base mb-4 text-gray-600">
              Your account ({email}) has been successfully created. You can now:
            </Text>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <Text className="text-sm mb-2 text-gray-700">✓ Browse and book amazing workspaces</Text>
              <Text className="text-sm mb-2 text-gray-700">✓ Manage your bookings and preferences</Text>
              <Text className="text-sm mb-2 text-gray-700">✓ Connect with workspace providers</Text>
              <Text className="text-sm text-gray-700">✓ Access exclusive deals and offers</Text>
            </div>
            
            <div className="text-center mb-6">
              <Button
                href={dashboardUrl}
                className="bg-blue-600 text-white font-bold py-3 px-6 rounded-md no-underline inline-block"
              >
                Get Started
              </Button>
            </div>
            
            <Text className="text-sm text-gray-500 text-center mb-4">
              Need help getting started? Check out our{' '}
              <a href="https://cowors.com/help" className="text-blue-600 underline">
                Help Center
              </a>{' '}
              or reply to this email.
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

export default Welcome;
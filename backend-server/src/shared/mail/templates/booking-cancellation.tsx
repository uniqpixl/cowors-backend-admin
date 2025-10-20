// BookingCancellation.tsx
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

interface BookingCancellationProps {
  customerName: string;
  bookingId: string;
  spaceName: string;
  checkInDate: string;
  checkOutDate: string;
  refundAmount: string;
  refundMethod: string;
  cancellationReason?: string;
  searchUrl: string;
}

export const BookingCancellation = ({
  customerName = '{{customerName}}',
  bookingId = '{{bookingId}}',
  spaceName = '{{spaceName}}',
  checkInDate = '{{checkInDate}}',
  checkOutDate = '{{checkOutDate}}',
  refundAmount = '{{refundAmount}}',
  refundMethod = '{{refundMethod}}',
  cancellationReason = '{{cancellationReason}}',
  searchUrl = '{{searchUrl}}',
}: BookingCancellationProps) => {
  return (
    <Html>
      <Head />
      <Preview>Booking cancellation confirmed - #{bookingId}</Preview>
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
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <Text className="text-xl font-bold text-center text-orange-800 mb-2">
                🚫 Booking Cancelled
              </Text>
              <Text className="text-center text-orange-700">
                Booking ID: #{bookingId}
              </Text>
            </div>
            
            <Text className="text-lg font-semibold mb-4 text-gray-700">
              Hi {customerName},
            </Text>
            
            <Text className="text-base mb-6 text-gray-600">
              Your booking has been successfully cancelled. Here are the details:
            </Text>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <Text className="text-lg font-semibold mb-3 text-gray-800">
                📍 {spaceName}
              </Text>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Original Check-in
                  </Text>
                  <Text className="text-sm font-medium text-gray-800">
                    {checkInDate}
                  </Text>
                </div>
                <div>
                  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Original Check-out
                  </Text>
                  <Text className="text-sm font-medium text-gray-800">
                    {checkOutDate}
                  </Text>
                </div>
              </div>
              
              {cancellationReason && (
                <div className="mb-4">
                  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Cancellation Reason
                  </Text>
                  <Text className="text-sm text-gray-700">{cancellationReason}</Text>
                </div>
              )}
            </div>
            
            {refundAmount && refundAmount !== '0' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <Text className="text-lg font-semibold mb-2 text-green-800">
                  💰 Refund Information
                </Text>
                <div className="flex justify-between items-center mb-2">
                  <Text className="text-sm text-green-700">Refund Amount:</Text>
                  <Text className="text-lg font-bold text-green-800">{refundAmount}</Text>
                </div>
                <Text className="text-sm text-green-700">
                  Refund will be processed to your {refundMethod} within 3-5 business days.
                </Text>
              </div>
            )}
            
            <div className="text-center mb-6">
              <Button
                href={searchUrl}
                className="bg-blue-600 text-white font-bold py-3 px-6 rounded-md no-underline inline-block"
              >
                Find Another Workspace
              </Button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <Text className="text-sm font-semibold text-blue-800 mb-2">
                😔 We're Sorry to See You Go
              </Text>
              <Text className="text-sm text-blue-700 mb-2">
                We hope you'll consider booking with us again in the future. We're constantly working to improve our service.
              </Text>
              <Text className="text-sm text-blue-700">
                If you have any feedback about your experience, we'd love to hear from you.
              </Text>
            </div>
            
            <Hr className="my-6" />
            
            <Text className="text-sm text-gray-500 text-center mb-4">
              Questions about your cancellation or refund? Contact us at{' '}
              <a href="mailto:support@cowors.com" className="text-blue-600 underline">
                support@cowors.com
              </a>
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

export default BookingCancellation;
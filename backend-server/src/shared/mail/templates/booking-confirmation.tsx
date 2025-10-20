// BookingConfirmation.tsx
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

interface BookingConfirmationProps {
  customerName: string;
  bookingId: string;
  spaceName: string;
  spaceAddress: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: string;
  originalAmount?: string;
  discountAmount?: string;
  couponCode?: string;
  paymentMethod: string;
  bookingUrl: string;
}

export const BookingConfirmation = ({
  customerName = '{{customerName}}',
  bookingId = '{{bookingId}}',
  spaceName = '{{spaceName}}',
  spaceAddress = '{{spaceAddress}}',
  checkInDate = '{{checkInDate}}',
  checkOutDate = '{{checkOutDate}}',
  totalAmount = '{{totalAmount}}',
  originalAmount = '{{originalAmount}}',
  discountAmount = '{{discountAmount}}',
  couponCode = '{{couponCode}}',
  paymentMethod = '{{paymentMethod}}',
  bookingUrl = '{{bookingUrl}}',
}: BookingConfirmationProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your booking is confirmed! Booking #{bookingId}</Preview>
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
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <Text className="text-xl font-bold text-center text-green-800 mb-2">
                ✅ Booking Confirmed!
              </Text>
              <Text className="text-center text-green-700">
                Booking ID: #{bookingId}
              </Text>
            </div>
            
            <Text className="text-lg font-semibold mb-4 text-gray-700">
              Hi {customerName},
            </Text>
            
            <Text className="text-base mb-6 text-gray-600">
              Great news! Your workspace booking has been confirmed. Here are your booking details:
            </Text>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <Text className="text-lg font-semibold mb-3 text-gray-800">
                📍 {spaceName}
              </Text>
              <Text className="text-sm text-gray-600 mb-4">{spaceAddress}</Text>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Check-in
                  </Text>
                  <Text className="text-sm font-medium text-gray-800">
                    {checkInDate}
                  </Text>
                </div>
                <div>
                  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Check-out
                  </Text>
                  <Text className="text-sm font-medium text-gray-800">
                    {checkOutDate}
                  </Text>
                </div>
              </div>
              
              <Hr className="my-4" />
              
              {originalAmount && discountAmount && couponCode && (
                <>
                  <div className="flex justify-between items-center">
                    <Text className="text-sm text-gray-600">Original Amount:</Text>
                    <Text className="text-sm text-gray-600">{originalAmount}</Text>
                  </div>
                  <div className="flex justify-between items-center">
                    <Text className="text-sm text-green-600">Discount ({couponCode}):</Text>
                    <Text className="text-sm text-green-600">-{discountAmount}</Text>
                  </div>
                  <Hr className="my-2" />
                </>
              )}
              
              <div className="flex justify-between items-center">
                <Text className="text-sm text-gray-600">Total Amount:</Text>
                <Text className="text-lg font-bold text-gray-800">{totalAmount}</Text>
              </div>
              <Text className="text-xs text-gray-500">Paid via {paymentMethod}</Text>
            </div>
            
            <div className="text-center mb-6">
              <Button
                href={bookingUrl}
                className="bg-blue-600 text-white font-bold py-3 px-6 rounded-md no-underline inline-block"
              >
                View Booking Details
              </Button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <Text className="text-sm font-semibold text-blue-800 mb-2">
                📋 What's Next?
              </Text>
              <Text className="text-sm text-blue-700 mb-1">
                • You'll receive check-in instructions 24 hours before your arrival
              </Text>
              <Text className="text-sm text-blue-700 mb-1">
                • Contact the space provider if you have any questions
              </Text>
              <Text className="text-sm text-blue-700">
                • Review our cancellation policy in your booking details
              </Text>
            </div>
            
            <Text className="text-sm text-gray-500 text-center mb-4">
              Questions about your booking? Contact us at{' '}
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

export default BookingConfirmation;
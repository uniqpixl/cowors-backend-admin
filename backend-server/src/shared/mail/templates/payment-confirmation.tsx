// PaymentConfirmation.tsx
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

interface PaymentConfirmationProps {
  customerName: string;
  transactionId: string;
  bookingId: string;
  spaceName: string;
  amount: string;
  paymentMethod: string;
  transactionDate: string;
  invoiceUrl: string;
  bookingUrl: string;
}

export const PaymentConfirmation = ({
  customerName = '{{customerName}}',
  transactionId = '{{transactionId}}',
  bookingId = '{{bookingId}}',
  spaceName = '{{spaceName}}',
  amount = '{{amount}}',
  paymentMethod = '{{paymentMethod}}',
  transactionDate = '{{transactionDate}}',
  invoiceUrl = '{{invoiceUrl}}',
  bookingUrl = '{{bookingUrl}}',
}: PaymentConfirmationProps) => {
  return (
    <Html>
      <Head />
      <Preview>Payment confirmed - Transaction #{transactionId}</Preview>
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
                ✅ Payment Successful!
              </Text>
              <Text className="text-center text-green-700">
                Transaction ID: #{transactionId}
              </Text>
            </div>
            
            <Text className="text-lg font-semibold mb-4 text-gray-700">
              Hi {customerName},
            </Text>
            
            <Text className="text-base mb-6 text-gray-600">
              Your payment has been successfully processed. Here are your transaction details:
            </Text>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <Text className="text-lg font-semibold mb-4 text-gray-800">
                💳 Payment Details
              </Text>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Text className="text-sm text-gray-600">Booking:</Text>
                  <Text className="text-sm font-medium text-gray-800">#{bookingId}</Text>
                </div>
                
                <div className="flex justify-between">
                  <Text className="text-sm text-gray-600">Workspace:</Text>
                  <Text className="text-sm font-medium text-gray-800">{spaceName}</Text>
                </div>
                
                <div className="flex justify-between">
                  <Text className="text-sm text-gray-600">Amount Paid:</Text>
                  <Text className="text-lg font-bold text-gray-800">{amount}</Text>
                </div>
                
                <div className="flex justify-between">
                  <Text className="text-sm text-gray-600">Payment Method:</Text>
                  <Text className="text-sm font-medium text-gray-800">{paymentMethod}</Text>
                </div>
                
                <div className="flex justify-between">
                  <Text className="text-sm text-gray-600">Transaction Date:</Text>
                  <Text className="text-sm font-medium text-gray-800">{transactionDate}</Text>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-center mb-6">
              <Button
                href={invoiceUrl}
                className="bg-gray-600 text-white font-bold py-2 px-4 rounded-md no-underline inline-block text-sm"
              >
                Download Invoice
              </Button>
              <Button
                href={bookingUrl}
                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md no-underline inline-block text-sm"
              >
                View Booking
              </Button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <Text className="text-sm font-semibold text-blue-800 mb-2">
                📧 Receipt & Invoice
              </Text>
              <Text className="text-sm text-blue-700 mb-2">
                This email serves as your payment receipt. You can also download a detailed invoice using the button above.
              </Text>
              <Text className="text-sm text-blue-700">
                Keep this for your records and expense reporting.
              </Text>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <Text className="text-sm font-semibold text-yellow-800 mb-2">
                🔒 Security Notice
              </Text>
              <Text className="text-sm text-yellow-700">
                For your security, we never include full payment details in emails. 
                If you have concerns about this transaction, please contact us immediately.
              </Text>
            </div>
            
            <Hr className="my-6" />
            
            <Text className="text-sm text-gray-500 text-center mb-4">
              Questions about your payment? Contact us at{' '}
              <a href="mailto:billing@cowors.com" className="text-blue-600 underline">
                billing@cowors.com
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

export default PaymentConfirmation;
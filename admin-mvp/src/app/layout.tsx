import { Outfit } from 'next/font/google';
import './globals.css';
import { RootProviders } from '@/components/providers/RootProviders';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <RootProviders>
          {children}
        </RootProviders>
      </body>
    </html>
  );
}
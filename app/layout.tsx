import { GeistSans } from 'geist/font/sans';
import './globals.css';
import SupabaseProvider from './context/SupabaseProvider';

export const metadata = {
  title: 'Customer Information List',
  description: '',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body className="bg-background text-foreground">
        <SupabaseProvider>
          <main className="min-h-screen">{children}</main>
        </SupabaseProvider>
      </body>
    </html>
  );
}
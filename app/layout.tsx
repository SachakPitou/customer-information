
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { supabase } from './supabaseClient';

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
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
   
  );
}

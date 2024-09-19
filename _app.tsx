import { AppProps } from 'next/app';
import { middleware } from '@/middleware';


function MyApp({ Component, pageProps }: AppProps) {
  return (
    
      <Component {...pageProps} />
    
  );
}

MyApp.middleware = middleware; // Apply Supabase middleware globally

export default MyApp;
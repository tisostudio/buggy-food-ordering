import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Loader from "@/components/common/Loader";
export default function App({ Component, pageProps }: AppProps) {
   const router = useRouter();
   const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleStop = () => setLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleStop);
    router.events.on('routeChangeError', handleStop);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleStop);
      router.events.off('routeChangeError', handleStop);
    };
  }, [router]);


  return (
    <AuthProvider>
      {loading && <Loader />}
      <Component {...pageProps} />
      <Toaster position="top-center" />
    </AuthProvider>
  );
}

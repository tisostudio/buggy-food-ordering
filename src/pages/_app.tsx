import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "react-hot-toast";
import Loader from "./loading";
import useRouteLoading from "@/hooks/useRouteLoading";

export default function App({ Component, pageProps }: AppProps) {
  const isLoading = useRouteLoading();

  return (
    <AuthProvider>
      {isLoading ? (
        <Loader/>
      ) : (
        <>
          <Component {...pageProps} />
          <Toaster position="top-center" />
        </>
      )}
    </AuthProvider>
  );
}

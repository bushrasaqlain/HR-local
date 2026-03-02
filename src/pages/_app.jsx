"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Provider } from "react-redux";
import { store } from "../redux/store";
import "../styles/index.scss";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../public/scss/components/employer/pricing.scss";
import "../../public/scss/components/employer/employer.scss";
import "../../public/scss/components/message-box.scss";
import PublicLayout from "./publicfooter";
import DefaulHeader2 from "../layout/header";
import DashboardHeader from "../layout/dashboard-header";
import { useRouter } from "next/router";
if (typeof window !== "undefined") {
  require("bootstrap/dist/js/bootstrap");
}
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// stripePromise
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY);

function AppContent({ Component, pageProps }) {
  const router = useRouter();
  const accountType = useSelector((state) => state.user.accountType);

  const isDashboardRoute =
    accountType === "db_admin" ||
    accountType === "reg_admin" ||
    accountType === "employer" ||
    accountType === "candidate";

  return isDashboardRoute ? (
    <DashboardHeader>
      <div style={{ paddingTop: "80px" }}>
      <Component {...pageProps} />
      </div>
    </DashboardHeader>
  ) : (
    <PublicLayout>
      <DefaulHeader2 />
      <Component {...pageProps} />
    </PublicLayout>
  );
}

function MyApp({ Component, pageProps }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Provider store={store}>
      <Elements stripe={stripePromise}>
        <QueryClientProvider client={queryClient}>
          <AppContent Component={Component} pageProps={pageProps} />
        </QueryClientProvider>
      </Elements>
      <ToastContainer />
    </Provider>
  );
}

export default MyApp;
"use client";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ToastContainer } from "react-toastify";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Provider } from "react-redux";
import { store } from "../redux/store";
import { setUserFromToken } from "../redux/features/user/userSlice";
import "../styles/index.scss";
import "../styles/messages.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../public/scss/components/employer/pricing.scss";
import "../../public/scss/components/employer/employer.scss";
import "../../public/scss/components/message-box.scss";
import PublicLayout from "./publicfooter";
import DefaulHeader2 from "../layout/header";
import DashboardHeader from "../layout/dashboard-header";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AOS from "aos";
import "aos/dist/aos.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

if (typeof window !== "undefined") {
  require("bootstrap/dist/js/bootstrap");
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY);

function AppContent({ Component, pageProps }) {
  const accountType = useSelector((state) => state.user.accountType);
  const [restored, setRestored] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    AOS.init({ duration: 1000, once: true, easing: "ease-in-out" });
  }, []);

  useEffect(() => {
    const storedAccountType = sessionStorage.getItem("accountType");
    const storedUserId = sessionStorage.getItem("userId");
    if (storedAccountType && storedUserId) {
      dispatch(setUserFromToken({ userId: storedUserId, accountType: storedAccountType }));
    }
    setRestored(true);
  }, [dispatch]);

  // ✅ EMPLOYER GUARD - har route change pe
  useEffect(() => {
    if (!restored) return;
    if (typeof window === "undefined") return;

    const storedAccountType = sessionStorage.getItem("accountType");
    if (storedAccountType !== "employer") return;

    const publicPages = ["/privacy-policy", "/terms-of-service", "/contact-us"];
    if (publicPages.includes(router.pathname)) return;

    const profileCompleted = sessionStorage.getItem("profile_completed") === "true";
    const currentPath = router.pathname;
    if (!profileCompleted && currentPath !== "/company-profile") {
      router.push("/company-profile");
      return;
    }
    // if (profileCompleted && !hasPackage && currentPath !== "/company-packages") {
    //   window.location.href = "/company-packages";
    //   return;
    // }
  }, [restored, router.pathname]);

  if (!restored) return null;

  const role = (accountType || sessionStorage.getItem("accountType"))?.toLowerCase();

  const isDashboardRoute =
    role === "db_admin" ||
    role === "reg_admin" ||
    role === "employer" ||
    role === "candidate";

  const isHistoryPage = router.pathname.startsWith("/history");

  const isProfileOrPackages =
    router.pathname === "/company-profile";

  const isPublicPage =
    router.pathname === "/privacy-policy" ||
    router.pathname === "/terms-of-service" ||
    router.pathname === "/contact-us";

  console.log("APP DEBUG:", { role, isDashboardRoute, isProfileOrPackages, pathname: router.pathname });

  return isHistoryPage ? (
    <>
      <DashboardHeader key="history" headerOnly={true} />
      <Component {...pageProps} />
    </>
  ) : isDashboardRoute ? (
    isProfileOrPackages ? (
      <>
        <DashboardHeader key="dashboard-header-only" headerOnly={true} />
        <Component {...pageProps} />
      </>
    ) : isPublicPage ? (
      <>
        <DashboardHeader key="dashboard-public" headerOnly={true} />
        <Component {...pageProps} />
      </>
    ) : (
      <DashboardHeader key="dashboard" />
    )
  ) : (
    <PublicLayout key="public">
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
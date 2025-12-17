import { useState } from "react";  // ⬅️ add this
import { ToastContainer } from "react-toastify";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Provider } from "react-redux";
import { store } from "../redux/store";
// import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles/index.scss";

if (typeof window !== "undefined") {
  require("bootstrap/dist/js/bootstrap");
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// stripePromise
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY);

function MyApp({ Component, pageProps }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <Provider store={store}>
      <Elements stripe={stripePromise}>
        <QueryClientProvider client={queryClient}>
          <Component {...pageProps} />
        </QueryClientProvider>
      </Elements>
      <ToastContainer />
    </Provider>
  );
}

export default MyApp;
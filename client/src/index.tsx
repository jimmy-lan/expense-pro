import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { ThemeProvider } from "@material-tailwind/react";
import { theme } from "./theme";
import { QueryClientProvider } from "@tanstack/react-query";
import { createAppQueryClient } from "./lib/queryClient";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = createAppQueryClient();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider value={theme}>
      <QueryClientProvider client={queryClient}>
        <App />
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${process.env.PUBLIC_URL}/service-worker.js`)
      .then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              registration.waiting?.postMessage({ type: "SKIP_WAITING" });
            }
          });

          // Encourage immediate activation for newly installing worker
          try {
            newWorker.postMessage({ type: "SKIP_WAITING" });
          } catch {}
        });

        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });

        // Periodically ask the browser to check for SW update without forcing asset refetches.
        // Browsers already revalidate based on HTTP caching; this only checks the SW script.
        const TWELVE_HOURS = 12 * 60 * 60 * 1000;
        let lastUpdateCheck = 0;

        const maybeCheckForUpdate = () => {
          const now = Date.now();
          if (now - lastUpdateCheck < 60 * 1000) return; // throttle within a minute
          lastUpdateCheck = now;
          registration.update().catch(() => {});
        };

        // Initial check shortly after load to reduce first-load staleness
        setTimeout(maybeCheckForUpdate, 5 * 1000);
        // Recurring check every 12 hours while a tab is open
        setInterval(maybeCheckForUpdate, TWELVE_HOURS);
      })
      .catch(() => {});
  });
}

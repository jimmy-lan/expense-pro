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
  (async () => {
    const BUILD =
      (import.meta as any).env?.VITE_BUILD_HASH ||
      process.env.REACT_APP_BUILD_HASH ||
      null;

    const swUrl = BUILD
      ? `/service-worker.js?v=${BUILD}`
      : `/service-worker.js`;

    const registration = await navigator.serviceWorker.register(swUrl, {
      updateViaCache: "none", // fetch SW script fresh (ignores HTTP cache for SW + imports)
      // scope: "/", // set if your app isn't at origin root
    });

    // Reload once when the new worker takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    // If there is already a waiting worker (user had the page open during deploy), activate it
    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    // When a new worker is found, ask it to activate as soon as it's installed
    registration.addEventListener("updatefound", () => {
      const nw = registration.installing;
      if (!nw) return;
      nw.addEventListener("statechange", () => {
        if (nw.state === "installed" && navigator.serviceWorker.controller) {
          registration.waiting?.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });

    setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000);
  })();
}

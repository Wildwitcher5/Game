import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "../alliance-v10.jsx";

// Intercept fetch to add Anthropic API key for direct browser access
const _origFetch = window.fetch.bind(window);
window.fetch = function (url, opts = {}) {
  if (typeof url === "string" && url.includes("api.anthropic.com")) {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || "";
    opts = {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
    };
  }
  return _origFetch(url, opts);
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

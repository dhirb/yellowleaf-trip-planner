import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./styles/global.css";
import App from "./App.tsx";

// Register the service worker (auto-updates in the background). Bundled into our
// own JS, so it stays within the `script-src 'self'` CSP.
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

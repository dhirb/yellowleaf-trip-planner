import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./styles/global.css";
// Imported for its side effect: starts buffering `beforeinstallprompt` at load,
// before React mounts, so the custom install button can offer it later.
import "./lib/pwaInstall";
import App from "./App.tsx";

// Register the service worker (auto-updates in the background). Bundled into our
// own JS, so it stays within the `script-src 'self'` CSP.
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

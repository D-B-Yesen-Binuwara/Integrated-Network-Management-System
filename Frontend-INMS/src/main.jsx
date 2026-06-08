import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AppStoreProvider } from "./store/index.jsx";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig";

const msalInstance = new PublicClientApplication(msalConfig);

// initialize() MUST fully complete before rendering.
// MSAL v3: loginPopup silently does nothing if called on an uninitialized instance.
msalInstance.initialize().then(async () => {

  const response = await msalInstance.handleRedirectPromise();

  if (response?.account) {
    msalInstance.setActiveAccount(response.account);
  }

  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <AppStoreProvider>
          <App />
        </AppStoreProvider>
      </MsalProvider>
    </StrictMode>
  );
});
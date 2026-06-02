import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppStoreProvider } from './store/index.jsx'

import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig";

const msalInstance = new PublicClientApplication(msalConfig);
msalInstance.initialize().then(() => {
  console.log("MSAL Ready");
  console.log(msalInstance.getAllAccounts());
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <AppStoreProvider>
        <App />
      </AppStoreProvider>
    </MsalProvider>
  </StrictMode>,
)
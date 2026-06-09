export const msalConfig = {
  auth: {
    clientId: "f531197f-847f-4c29-8fdf-30d1bf4f76b1",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: "http://localhost:5173",
    postLogoutRedirectUri: "http://localhost:5173/login",
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    allowNativeBroker: false,
    windowHashTimeout: 60000,
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};
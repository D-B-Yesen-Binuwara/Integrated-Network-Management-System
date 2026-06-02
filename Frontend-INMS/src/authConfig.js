export const msalConfig = {
  auth: {
    clientId: "f531197f-847f-4c29-8fdf-30d1bf4f76b1",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: "http://localhost:5173",
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};
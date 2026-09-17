import { createAuthClient } from "better-auth/react";

function getApiUrl() {
  const url = import.meta.env.VITE_API_URL;
  if (!url) {
    throw new Error("VITE_API_URL is not set");
  }
  return url;
}

export const authClient = createAuthClient({
  baseURL: getApiUrl(),
  fetchOptions: {
    credentials: "include",
  },
});

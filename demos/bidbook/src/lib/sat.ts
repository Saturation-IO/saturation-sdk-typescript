"use client";

import { Saturation } from "@saturationio/sdk";

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_SATURATION_API_URL ?? "http://localhost:4300/v1";

const TOKEN_KEY = "bidbook.token";
const BASE_KEY = "bidbook.baseUrl";

// Same-origin proxy mount (see next.config.mjs rewrites). The browser only ever
// talks to this app; the app forwards to the real API server-side.
const PROXY_PREFIX = "/api/sat";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Resolve the SDK base URL. When the user leaves the default, we route through
 * the same-origin proxy so the token never crosses origins (no CORS, and the
 * secret stays off third-party origins). An explicit custom base URL is used
 * as-is for direct-to-API testing.
 */
export function getStoredBaseUrl(): string {
  if (typeof window === "undefined") return DEFAULT_BASE_URL;
  const stored = window.sessionStorage.getItem(BASE_KEY);
  if (stored && stored !== DEFAULT_BASE_URL) return stored;
  return `${window.location.origin}${PROXY_PREFIX}/v1`;
}

export function storeCredentials(token: string, baseUrl?: string) {
  window.sessionStorage.setItem(TOKEN_KEY, token);
  window.sessionStorage.setItem(BASE_KEY, baseUrl?.trim() || DEFAULT_BASE_URL);
}

export function clearCredentials() {
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(BASE_KEY);
}

/** Build a client from the token in session storage (or an explicit one). */
export function makeClient(token?: string): Saturation {
  const t = token ?? getStoredToken();
  if (!t) throw new Error("No API token. Connect first.");
  return new Saturation({ token: t, baseURL: getStoredBaseUrl() });
}

export { DEFAULT_BASE_URL };

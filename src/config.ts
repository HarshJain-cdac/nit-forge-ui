// Paste your Waku backend URL here (e.g. "https://api.example.com").
// It must be an absolute URL — a relative value makes requests hit this app instead.
const FALLBACK_API_BASE = "";

const RAW_API_BASE = (import.meta.env['VITE_API_BASE'] || FALLBACK_API_BASE || "").trim();

/** Backend origin without a trailing slash. */
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

export { API_BASE };

/**
 * Waku backend endpoints.
 * Every network call in the app is built from API_BASE via these helpers.
 */
export const API_ENDPOINTS = {
  /** Starts a session / sends a free-form user message. Returns a Waku event. */
  chat: "/chat",
  /** Answers a wizard field (ask_field) or a clarification (ask_options). */
  answer: "/answer",
  /** Multipart file upload for `file` type questions. */
  upload: "/upload",
  /** Runs one of the actions returned by flow_complete. */
  action: "/action",
  /** Natural-language edits against a generated NiT (AI Edit chatbot). */
  nitChat: "/nit/chat",
  /** Persists manual edits made in the document editor. */
  nitUpdate: "/nit/update",
} as const;

export function apiUrl(path: string): string {
  if (!API_BASE) {
    throw new Error(
      "Backend URL is not set. Add your Waku backend URL in src/config.ts (or set VITE_API_BASE).",
    );
  }
  if (!/^https?:\/\//i.test(API_BASE)) {
    throw new Error(
      `Backend URL "${API_BASE}" is invalid — it must start with http:// or https://.`,
    );
  }
  return `${API_BASE}${path}`;
}

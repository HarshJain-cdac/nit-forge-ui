// Paste your Waku backend URL here
const API_BASE = import.meta.env['VITE_API_BASE'] || "";

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
  return `${API_BASE}${path}`;
}

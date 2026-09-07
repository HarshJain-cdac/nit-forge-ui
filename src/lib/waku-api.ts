import { API_ENDPOINTS, apiUrl } from "@/config";
import { normalizeEvent, type WakuEvent } from "@/lib/waku-types";

async function postJson(path: string, body: unknown): Promise<WakuEvent> {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    const message =
      (parsed && typeof parsed === "object" && "message" in parsed
        ? String((parsed as Record<string, unknown>).message)
        : text) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return normalizeEvent(parsed);
}

export function sendMessage(sessionId: string | null, message: string) {
  return postJson(API_ENDPOINTS.chat, { session_id: sessionId, message });
}

export function sendAnswer(
  sessionId: string | null,
  payload: { key?: string; question?: string; value: unknown },
) {
  return postJson(API_ENDPOINTS.answer, { session_id: sessionId, ...payload });
}

export function sendAction(sessionId: string | null, action: string) {
  return postJson(API_ENDPOINTS.action, { session_id: sessionId, action });
}

export function sendNitChat(sessionId: string | null, message: string, fileId?: string) {
  return postJson(API_ENDPOINTS.nitChat, {
    session_id: sessionId,
    message,
    ...(fileId ? { file_id: fileId } : {}),
  });
}

export function saveNit(
  sessionId: string | null,
  fields: Record<string, unknown>,
  annexureItems: unknown[],
) {
  return postJson(API_ENDPOINTS.nitUpdate, {
    session_id: sessionId,
    fields,
    annexure_items: annexureItems,
  });
}

export interface UploadResult {
  file_id?: string;
  status?: string;
  message?: string;
  raw: unknown;
}

/** Uploads a file with real progress reporting via XHR. */
export function uploadFile(
  sessionId: string | null,
  file: File,
  key: string | undefined,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    if (sessionId) form.append("session_id", sessionId);
    if (key) form.append("key", key);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", apiUrl(API_ENDPOINTS.upload));

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = xhr.responseText ? JSON.parse(xhr.responseText) : {};
      } catch {
        parsed = {};
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          file_id:
            typeof parsed.file_id === "string"
              ? parsed.file_id
              : typeof parsed.id === "string"
                ? parsed.id
                : undefined,
          status: typeof parsed.status === "string" ? parsed.status : undefined,
          message: typeof parsed.message === "string" ? parsed.message : undefined,
          raw: parsed,
        });
      } else {
        reject(
          new Error(
            (typeof parsed.message === "string" && parsed.message) ||
              `Upload failed (${xhr.status})`,
          ),
        );
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(form);
  });
}

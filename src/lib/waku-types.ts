export type FieldType =
  | "text"
  | "dropdown"
  | "radio"
  | "email"
  | "mobile"
  | "number"
  | "file";

export interface AskOptionsEvent {
  event: "ask_options";
  question: string;
  options: string[];
}

export interface AskFieldEvent {
  event: "ask_field";
  key: string;
  question: string;
  type: FieldType;
  options: string[];
  mandatory: boolean;
}

export interface FlowCompleteEvent {
  event: "flow_complete";
  flow: string;
  answers: Record<string, unknown>;
  actions: string[];
}

export interface NitUpdatedEvent {
  event: "nit_updated";
  session_id: string;
  fields: Record<string, unknown>;
  annexure_items: unknown[];
}

export interface MessageEvent {
  event: "message";
  message: string;
}

export interface ErrorEvent {
  event: "error";
  message: string;
}

export type WakuEvent =
  | AskOptionsEvent
  | AskFieldEvent
  | FlowCompleteEvent
  | NitUpdatedEvent
  | MessageEvent
  | ErrorEvent;

export interface UploadedFileInfo {
  name: string;
  type: string;
  size: number;
  /** Reference returned by the backend, submitted as the field answer. */
  file_id?: string | undefined;
  status: "uploading" | "processing" | "verified" | "failed";
  progress: number;
  message?: string | undefined;
}

/** Normalizes the many envelope shapes a backend may use into a WakuEvent. */
export function normalizeEvent(raw: unknown): WakuEvent {
  if (!raw || typeof raw !== "object") {
    return { event: "error", message: "Empty response from Waku." };
  }
  const obj = raw as Record<string, unknown>;

  const asRecord = (v: unknown): Record<string, unknown> =>
    v && typeof v === "object" ? (v as Record<string, unknown>) : {};

  // The Waku backend returns a flat object like:
  //   { reply, session_id, ask_field?: {...}, ask_options?: {...}, flow_complete?: {...} }
  // Merge any of those nested payloads (and a legacy {data: {...}} envelope)
  // into one flat map, remembering which kind of payload was present.
  const KNOWN = ["ask_field", "ask_options", "flow_complete", "nit_updated"] as const;
  const m: Record<string, unknown> = { ...obj };
  let name = typeof obj["event"] === "string" ? (obj["event"] as string) : undefined;

  for (const k of KNOWN) {
    const nested = asRecord(obj[k]);
    if (Object.keys(nested).length > 0) {
      Object.assign(m, nested);
      if (!name) name = k;
    }
    delete m[k];
  }

  const data = asRecord(obj["data"]);
  if (Object.keys(data).length > 0) {
    Object.assign(m, data);
    for (const k of KNOWN) {
      const nested = asRecord(data[k]);
      if (Object.keys(nested).length > 0) {
        Object.assign(m, nested);
        if (!name) name = k;
      }
      delete m[k];
    }
  }
  delete m["data"];

  const str = (k: string, fallback = "") =>
    typeof m[k] === "string" ? (m[k] as string) : fallback;
  const list = (k: string): string[] =>
    Array.isArray(m[k]) ? (m[k] as string[]) : [];
  const record = (k: string): Record<string, unknown> =>
    m[k] && typeof m[k] === "object" ? (m[k] as Record<string, unknown>) : {};

  

  if (name === "ask_field" || (!name && typeof m["key"] === "string" && !!m["type"])) {
    return {
      event: "ask_field",
      key: str("key"),
      question: str("question"),
      type: (str("type", "text") as FieldType),
      options: list("options"),
      mandatory: Boolean(m["mandatory"]),
    };
  }

  if (name === "ask_options" || (!name && typeof m["question"] === "string")) {
    return { event: "ask_options", question: str("question"), options: list("options") };
  }

  if (name === "flow_complete") {
    return {
      event: "flow_complete",
      flow: str("flow"),
      answers: record("answers"),
      actions: list("actions"),
    };
  }

  if (name === "nit_updated") {
    return {
      event: "nit_updated",
      session_id: str("session_id"),
      fields: record("fields"),
      annexure_items: Array.isArray(m["annexure_items"]) ? (m["annexure_items"] as unknown[]) : [],
    };
  }

  if (name === "error") {
    return { event: "error", message: str("message", "Something went wrong.") };
  }

  // A normal assistant reply: { reply: "...", session_id: "...", ... }
  if (typeof m["reply"] === "string" && m["reply"].trim()) {
    return { event: "message", message: m["reply"] as string };
  }

  if (typeof m["message"] === "string") {
    return { event: "message", message: m["message"] as string };
  }

  return { event: "error", message: "Unrecognised response from Waku." };
}

export function validateAnswer(
  field: AskFieldEvent,
  value: string,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return field.mandatory ? "This answer is required." : null;
  }
  if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email address.";
  }
  if (field.type === "mobile" && !/^[+]?[\d\s-]{7,15}$/.test(trimmed)) {
    return "Enter a valid mobile number.";
  }
  if (field.type === "number" && Number.isNaN(Number(trimmed))) {
    return "Enter a valid number.";
  }
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

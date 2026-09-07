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
  file_id?: string;
  status: "uploading" | "processing" | "verified" | "failed";
  progress: number;
  message?: string;
}

/** Normalizes the many envelope shapes a backend may use into a WakuEvent. */
export function normalizeEvent(raw: unknown): WakuEvent {
  if (!raw || typeof raw !== "object") {
    return { event: "error", message: "Empty response from Waku." };
  }
  const obj = raw as Record<string, unknown>;

  // Envelope: { event: "ask_field", data: {...} }
  const inner =
    obj.data && typeof obj.data === "object"
      ? { ...(obj.data as Record<string, unknown>) }
      : {};
  const merged: Record<string, unknown> = { ...inner, ...obj };
  delete merged.data;

  const name = typeof merged.event === "string" ? merged.event : undefined;

  if (name === "ask_field" || (!name && typeof merged.key === "string" && merged.type)) {
    return {
      event: "ask_field",
      key: String(merged.key ?? ""),
      question: String(merged.question ?? ""),
      type: (merged.type as FieldType) ?? "text",
      options: Array.isArray(merged.options) ? (merged.options as string[]) : [],
      mandatory: Boolean(merged.mandatory),
    };
  }

  if (name === "ask_options" || (!name && typeof merged.question === "string")) {
    return {
      event: "ask_options",
      question: String(merged.question ?? ""),
      options: Array.isArray(merged.options) ? (merged.options as string[]) : [],
    };
  }

  if (name === "flow_complete") {
    return {
      event: "flow_complete",
      flow: String(merged.flow ?? ""),
      answers: (merged.answers as Record<string, unknown>) ?? {},
      actions: Array.isArray(merged.actions) ? (merged.actions as string[]) : [],
    };
  }

  if (name === "nit_updated") {
    return {
      event: "nit_updated",
      session_id: String(merged.session_id ?? ""),
      fields: (merged.fields as Record<string, unknown>) ?? {},
      annexure_items: Array.isArray(merged.annexure_items) ? merged.annexure_items : [],
    };
  }

  if (name === "error") {
    return { event: "error", message: String(merged.message ?? "Something went wrong.") };
  }

  if (typeof merged.message === "string") {
    return { event: "message", message: merged.message };
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

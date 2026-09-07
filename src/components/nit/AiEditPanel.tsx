import { useEffect, useRef, useState } from "react";
import { Loader2, Paperclip, SendHorizontal, X, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendNitChat, uploadFile } from "@/lib/waku-api";
import { formatFileSize, type NitUpdatedEvent } from "@/lib/waku-types";

export interface ChatMessage {
  id: string;
  role: "user" | "waku";
  text: string;
  attachment?: { name: string; size: number } | undefined;
}

interface AiEditPanelProps {
  sessionId: string | null;
  onNitUpdated: (event: NitUpdatedEvent) => void;
  onClose: () => void;
}

export function AiEditPanel({ sessionId, onNitUpdated, onClose }: AiEditPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; size: number; id?: string } | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, busy]);

  function push(message: ChatMessage) {
    setMessages((prev) => [...prev, message]);
  }

  async function attach(file: File) {
    setUploading(true);
    try {
      const result = await uploadFile(sessionId, file, undefined, () => {});
      setAttachment({ name: file.name, size: file.size, ...(result.file_id ? { id: result.file_id } : {}) });
    } catch (error) {
      push({
        id: crypto.randomUUID(),
        role: "waku",
        text: error instanceof Error ? error.message : "Attachment upload failed.",
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function send() {
    const text = input.trim();
    if ((!text && !attachment) || busy) return;

    push({
      id: crypto.randomUUID(),
      role: "user",
      text,
      attachment: attachment ? { name: attachment.name, size: attachment.size } : undefined,
    });
    setInput("");
    const fileId = attachment?.id;
    setAttachment(null);
    setBusy(true);

    try {
      const { event } = await sendNitChat(sessionId, text, fileId);
      if (event.event === "nit_updated") {
        onNitUpdated(event);
        push({ id: crypto.randomUUID(), role: "waku", text: "The document has been updated." });
      } else if (event.event === "error") {
        push({ id: crypto.randomUUID(), role: "waku", text: event.message });
      } else if (event.event === "message") {
        push({ id: crypto.randomUUID(), role: "waku", text: event.message });
      } else if ("question" in event) {
        push({ id: crypto.randomUUID(), role: "waku", text: event.question });
      }
    } catch (error) {
      push({
        id: crypto.randomUUID(),
        role: "waku",
        text: error instanceof Error ? error.message : "Waku is unavailable right now.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="flex h-full flex-col border-l border-border bg-background">
      <header className="flex items-center justify-between border-b border-border bg-brand-softer px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">AI Edit</p>
          <p className="text-xs text-muted-foreground">Describe the changes you need</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Close AI Edit" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {messages.length === 0 && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Ask Waku to revise clauses, dates, values or annexure items in the document.
          </p>
        )}

        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground">
                {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
                {message.attachment && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs opacity-90">
                    <FileText className="size-3.5" />
                    {message.attachment.name} · {formatFileSize(message.attachment.size)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div key={message.id} className="flex">
              <div className="max-w-[90%] rounded-2xl rounded-bl-sm border border-border bg-brand-softer px-3.5 py-2.5 text-sm text-foreground">
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
            </div>
          ),
        )}

        {busy && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" /> Waku is working…
          </p>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border p-3">
        {attachment && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-brand-softer px-3 py-2 text-xs">
            <FileText className="size-3.5 text-primary" />
            <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
            <button
              type="button"
              aria-label="Remove attachment"
              onClick={() => setAttachment(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        <div className="rounded-xl border border-border p-2 focus-within:border-primary/60">
          <Textarea
            rows={2}
            value={input}
            placeholder="e.g. Extend the bid submission deadline by 7 days"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            className="min-h-0 resize-none border-0 p-1 shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center justify-between pt-1">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void attach(file);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Attach file"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Paperclip className="size-4" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              aria-label="Send message"
              disabled={busy || (!input.trim() && !attachment)}
              onClick={() => void send()}
            >
              <SendHorizontal className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

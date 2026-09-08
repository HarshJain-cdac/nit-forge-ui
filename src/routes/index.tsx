import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Download,
  Loader2,
  MessageSquareText,
  Pencil,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { QuestionCard } from "@/components/nit/QuestionCard";
import { FlowSummary } from "@/components/nit/FlowSummary";
import { NitDocument, type NitData } from "@/components/nit/NitDocument";
import { AiEditPanel } from "@/components/nit/AiEditPanel";
import { Transcript, type TranscriptEntry } from "@/components/nit/Transcript";
import { downloadNit } from "@/lib/nit-download";
import { sendAction, sendAnswer, sendMessage, saveNit, type WakuResponse } from "@/lib/waku-api";
import type {
  AskFieldEvent,
  AskOptionsEvent,
  FlowCompleteEvent,
  NitUpdatedEvent,
} from "@/lib/waku-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Waku NiT Studio — Generate a Notice Inviting Tender" },
      {
        name: "description",
        content:
          "Answer a guided set of questions and Waku drafts a complete, editable Notice Inviting Tender document.",
      },
      { property: "og:title", content: "Waku NiT Studio — Generate a Notice Inviting Tender" },
      {
        property: "og:description",
        content:
          "Answer a guided set of questions and Waku drafts a complete, editable Notice Inviting Tender document.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NitApp,
});

type Question = AskFieldEvent | AskOptionsEvent;

function NitApp() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [flow, setFlow] = useState<FlowCompleteEvent | null>(null);
  const [nit, setNit] = useState<NitData | null>(null);
  const [editing, setEditing] = useState(false);
  const [aiEditOpen, setAiEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [starter, setStarter] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [transcript, question, flow, busy]);

  function addEntry(role: TranscriptEntry["role"], text: string) {
    if (!text) return;
    setTranscript((prev) => [...prev, { id: crypto.randomUUID(), role, text }]);
  }

  function apply(response: WakuResponse) {
    if (response.sessionId) setSessionId(response.sessionId);
    const event = response.event;

    switch (event.event) {
      case "ask_field":
      case "ask_options":
        setQuestion(event);
        setFlow(null);
        break;
      case "flow_complete":
        setQuestion(null);
        setFlow(event);
        break;
      case "nit_updated":
        setQuestion(null);
        setFlow(null);
        setNit({
          session_id: event.session_id || response.sessionId || "",
          fields: event.fields,
          annexure_items: event.annexure_items,
        });
        break;
      case "message":
        setQuestion(null);
        addEntry("waku", event.message);
        break;
      case "error":
        setError(event.message);
        break;
    }
  }

  async function run(call: () => Promise<WakuResponse>) {
    setBusy(true);
    setError(null);
    try {
      apply(await call());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach Waku.");
    } finally {
      setBusy(false);
    }
  }

  async function start(message: string) {
    const text = message.trim();
    if (!text) return;
    setStarted(true);
    addEntry("user", text);
    await run(() => sendMessage(null, text));
  }

  async function answer(value: string) {
    if (!question) return;
    addEntry("waku", question.question);
    addEntry("user", value || "(skipped)");
    setQuestion(null);
    const payload =
      question.event === "ask_field"
        ? { key: question.key, question: question.question, value }
        : { question: question.question, value };
    await run(() => sendAnswer(sessionId, payload));
  }

  async function act(action: string) {
    addEntry("user", action);
    await run(() => sendAction(sessionId, action));
  }

  async function persist() {
    if (!nit) return;
    setSaving(true);
    setError(null);
    try {
      const response = await saveNit(sessionId, nit.fields, nit.annexure_items);
      if (response.event.event === "nit_updated") apply(response);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your changes.");
    } finally {
      setSaving(false);
    }
  }

  function handleNitUpdated(event: NitUpdatedEvent) {
    setNit({
      session_id: event.session_id || sessionId || "",
      fields: event.fields,
      annexure_items: event.annexure_items,
    });
  }

  /* ---------------------------- Document stage ---------------------------- */

  if (nit) {
    return (
      <div className="flex h-screen flex-col bg-brand-softer">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-6 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Notice Inviting Tender</p>
            <p className="text-xs text-muted-foreground">Generated by Waku</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={() => void persist()} disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Save changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => downloadNit(nit)}>
                  <Download className="size-4" /> Download
                </Button>
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Pencil className="size-4" /> Edit
                </Button>
                <Button onClick={() => setAiEditOpen(true)}>
                  <MessageSquareText className="size-4" /> AI Edit
                </Button>
              </>
            )}
          </div>
        </header>

        {error && (
          <div className="flex items-center gap-2 border-b border-destructive/20 bg-destructive/5 px-6 py-2 text-sm text-destructive">
            <AlertCircle className="size-4" /> {error}
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          <main
            className="min-w-0 flex-1 overflow-y-auto px-4 py-8 sm:px-8"
            style={aiEditOpen ? { flexBasis: "75%" } : undefined}
          >
            <NitDocument
              data={nit}
              editing={editing}
              onFieldChange={(key, value) =>
                setNit((prev) =>
                  prev ? { ...prev, fields: { ...prev.fields, [key]: value } } : prev,
                )
              }
              onAnnexureChange={(index, value) =>
                setNit((prev) =>
                  prev
                    ? {
                        ...prev,
                        annexure_items: prev.annexure_items.map((item, i) =>
                          i === index ? value : item,
                        ),
                      }
                    : prev,
                )
              }
            />
          </main>

          {aiEditOpen && (
            <div className="hidden w-1/4 min-w-[300px] shrink-0 lg:block">
              <AiEditPanel
                sessionId={sessionId}
                onNitUpdated={handleNitUpdated}
                onClose={() => setAiEditOpen(false)}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ------------------------------ Q&A stage ------------------------------ */

  const userEntryIds = transcript.filter((e) => e.role === "user").map((e) => e.id);
  const editableIds = userEntryIds.slice(-2);

  function beginEdit(id: string, text: string) {
    setEditingId(id);
    setStarter(text);
  }

  async function submitComposer() {
    const text = starter.trim();
    if (!text || busy) return;

    if (editingId) {
      const index = transcript.findIndex((e) => e.id === editingId);
      const kept = index >= 0 ? transcript.slice(0, index) : transcript;
      setTranscript([...kept, { id: crypto.randomUUID(), role: "user", text }]);
      setEditingId(null);
      setStarter("");
      setQuestion(null);
      setFlow(null);
      await run(() => sendMessage(sessionId, text));
      return;
    }

    setStarter("");
    if (!started) {
      await start(text);
      return;
    }
    if (question) {
      await answer(text);
      return;
    }
    addEntry("user", text);
    await run(() => sendMessage(sessionId, text));
  }

  return (
    <div className="brand-gradient flex h-screen flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
          {!started ? (
            <div className="flex flex-col items-center py-16 text-center">
              <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-primary">
                Waku
              </span>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Create a Notice Inviting Tender
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Start a conversation and Waku will guide you question by question, then draft the
                document for you.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <Transcript entries={transcript} editableIds={editableIds} onEdit={beginEdit} />

              {question && (
                <QuestionCard
                  question={question}
                  sessionId={sessionId}
                  busy={busy}
                  onSubmit={(value) => void answer(value)}
                />
              )}

              {flow && <FlowSummary data={flow} busy={busy} onAction={(a) => void act(a)} />}

              {busy && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-primary" /> Waku is thinking…
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div>
                <p>{error}</p>
                <button
                  type="button"
                  className="mt-1 underline underline-offset-4"
                  onClick={() => setError(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-background/80 backdrop-blur">
        <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6">
          {editingId && (
            <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-border bg-brand-softer px-3 py-2 text-xs text-muted-foreground">
              <span>Editing your earlier message — sending will replace it.</span>
              <button
                type="button"
                className="underline underline-offset-4 hover:text-foreground"
                onClick={() => {
                  setEditingId(null);
                  setStarter("");
                }}
              >
                Cancel
              </button>
            </div>
          )}
          <div className="surface-card p-2">
            <Textarea
              rows={2}
              autoFocus
              value={starter}
              placeholder={
                started ? "Type your reply…" : "Say hello, or describe what you need…"
              }
              onChange={(e) => setStarter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submitComposer();
                }
              }}
              className="min-h-0 resize-none border-0 bg-transparent p-3 text-base shadow-none focus-visible:ring-0"
            />
            <div className="flex justify-end p-1">
              <Button
                disabled={!starter.trim() || busy}
                onClick={() => void submitComposer()}
                aria-label="Send message"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
                {started ? "Send" : "Start"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

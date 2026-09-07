import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUploadField } from "@/components/nit/FileUploadField";
import { validateAnswer, type AskFieldEvent, type AskOptionsEvent } from "@/lib/waku-types";

interface QuestionCardProps {
  question: AskFieldEvent | AskOptionsEvent;
  sessionId: string | null;
  busy: boolean;
  onSubmit: (value: string) => void;
}

export function QuestionCard({ question, sessionId, busy, onSubmit }: QuestionCardProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isField = question.event === "ask_field";
  const type = isField ? question.type : "options";
  const options = question.options ?? [];

  useEffect(() => {
    setValue("");
    setError(null);
  }, [question]);

  function submit(raw: string) {
    if (busy) return;
    if (isField) {
      const message = validateAnswer(question, raw);
      if (message) {
        setError(message);
        return;
      }
      if (!raw.trim() && !question.mandatory) {
        onSubmit("");
        return;
      }
    } else if (!raw.trim()) {
      setError("Please choose or type an answer.");
      return;
    }
    setError(null);
    onSubmit(raw.trim());
  }

  return (
    <div className="surface-card p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-base font-semibold leading-relaxed text-foreground sm:text-lg">
          {question.question}
        </h2>
        {isField && (
          <span className="mt-1 shrink-0 rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-medium text-accent-foreground">
            {question.mandatory ? "Required" : "Optional"}
          </span>
        )}
      </div>

      <div className="mt-5 space-y-4">
        {type === "options" && (
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <Button
                key={option}
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => submit(option)}
                className="rounded-full border-border bg-brand-softer text-foreground hover:bg-brand-soft"
              >
                {option}
              </Button>
            ))}
          </div>
        )}

        {type === "dropdown" && (
          <Select
            value={value}
            onValueChange={(next) => {
              setValue(next);
              setError(null);
            }}
            disabled={busy}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {type === "radio" && (
          <RadioGroup
            value={value}
            onValueChange={(next) => {
              setValue(next);
              setError(null);
            }}
            className="gap-2"
          >
            {options.map((option) => (
              <Label
                key={option}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-normal transition-colors hover:bg-brand-softer has-[button[data-state=checked]]:border-primary/60 has-[button[data-state=checked]]:bg-brand-soft"
              >
                <RadioGroupItem value={option} disabled={busy} />
                {option}
              </Label>
            ))}
          </RadioGroup>
        )}

        {(type === "text" || type === "email" || type === "mobile" || type === "number") && (
          <Input
            autoFocus
            value={value}
            disabled={busy}
            inputMode={type === "number" ? "decimal" : type === "mobile" ? "tel" : "text"}
            type={type === "email" ? "email" : type === "number" ? "number" : "text"}
            placeholder="Type your answer"
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit(value);
            }}
            className="h-11"
          />
        )}

        {type === "file" && (
          <FileUploadField
            sessionId={sessionId}
            fieldKey={isField ? question.key : undefined}
            disabled={busy}
            onUploaded={(fileId, info) => {
              setValue(fileId ?? info.name);
              setError(null);
            }}
            onCleared={() => setValue("")}
          />
        )}

        {type === "options" && (
          <Input
            value={value}
            disabled={busy}
            placeholder="Or type your own answer"
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit(value);
            }}
            className="h-11"
          />
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {type !== "options" || value ? (
          <div className="flex items-center justify-between gap-3 pt-1">
            {isField && !question.mandatory ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => submit("")}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Skip
              </button>
            ) : (
              <span />
            )}
            <Button type="button" disabled={busy} onClick={() => submit(value)}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Continue"}
              {!busy && <ArrowRight className="size-4" />}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FlowCompleteEvent } from "@/lib/waku-types";
import { renderValue } from "@/lib/render-value";

interface FlowSummaryProps {
  data: FlowCompleteEvent;
  busy: boolean;
  onAction: (action: string) => void;
}

export function FlowSummary({ data, busy, onAction }: FlowSummaryProps) {
  const entries = Object.entries(data.answers);

  return (
    <div className="surface-card overflow-hidden">
      <div className="border-b border-border bg-brand-softer px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-accent-foreground">
          Collected information
        </p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">{data.flow}</h2>
      </div>

      <dl className="divide-y divide-border">
        {entries.map(([key, value]) => (
          <div key={key} className="grid gap-1 px-6 py-3.5 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-6">
            <dt className="text-sm text-muted-foreground">{key}</dt>
            <dd className="text-sm font-medium text-foreground">{renderValue(value)}</dd>
          </div>
        ))}
      </dl>

      {data.actions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border bg-brand-softer px-6 py-4">
          {data.actions.map((action, index) => (
            <Button
              key={action}
              type="button"
              disabled={busy}
              variant={index === 0 ? "default" : "outline"}
              onClick={() => onAction(action)}
            >
              {busy && index === 0 ? <Loader2 className="size-4 animate-spin" /> : null}
              {action}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

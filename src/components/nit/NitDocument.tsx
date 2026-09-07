import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { humanizeKey, renderValue } from "@/lib/render-value";

export interface NitData {
  session_id: string;
  fields: Record<string, unknown>;
  annexure_items: unknown[];
}

interface NitDocumentProps {
  data: NitData;
  editing: boolean;
  onFieldChange: (key: string, value: unknown) => void;
  onAnnexureChange: (index: number, value: unknown) => void;
}

function isPrimitive(value: unknown) {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

export function NitDocument({
  data,
  editing,
  onFieldChange,
  onAnnexureChange,
}: NitDocumentProps) {
  const entries = Object.entries(data.fields);

  return (
    <article className="doc-page mx-auto w-full max-w-3xl px-8 py-10 sm:px-12 sm:py-14">
      <header className="border-b border-border pb-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Notice Inviting Tender
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Session {data.session_id || "—"}</p>
      </header>

      <section className="mt-8 space-y-5">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No document content has been returned yet.
          </p>
        )}

        {entries.map(([key, value]) => (
          <div key={key} className="grid gap-1.5 sm:grid-cols-[minmax(0,13rem)_1fr] sm:gap-6">
            <p className="text-sm font-medium text-muted-foreground">{humanizeKey(key)}</p>
            {editing ? (
              isPrimitive(value) ? (
                <Input
                  value={value === null || value === undefined ? "" : String(value)}
                  onChange={(e) => onFieldChange(key, e.target.value)}
                />
              ) : (
                <Textarea
                  rows={4}
                  value={JSON.stringify(value, null, 2)}
                  onChange={(e) => {
                    try {
                      onFieldChange(key, JSON.parse(e.target.value));
                    } catch {
                      onFieldChange(key, e.target.value);
                    }
                  }}
                  className="font-mono text-xs"
                />
              )
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {renderValue(value)}
              </p>
            )}
          </div>
        ))}
      </section>

      {data.annexure_items.length > 0 && (
        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
            Annexure
          </h2>
          <ol className="mt-4 space-y-3">
            {data.annexure_items.map((item, index) => (
              <li
                key={index}
                className="flex gap-3 rounded-lg border border-border bg-brand-softer px-4 py-3"
              >
                <span className="text-sm font-semibold text-primary">{index + 1}.</span>
                <div className="min-w-0 flex-1">
                  {editing ? (
                    isPrimitive(item) ? (
                      <Input
                        value={item === null || item === undefined ? "" : String(item)}
                        onChange={(e) => onAnnexureChange(index, e.target.value)}
                      />
                    ) : (
                      <Textarea
                        rows={4}
                        value={JSON.stringify(item, null, 2)}
                        onChange={(e) => {
                          try {
                            onAnnexureChange(index, JSON.parse(e.target.value));
                          } catch {
                            onAnnexureChange(index, e.target.value);
                          }
                        }}
                        className="font-mono text-xs"
                      />
                    )
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {renderValue(item)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}

import { Pencil } from "lucide-react";

export interface TranscriptEntry {
  id: string;
  role: "user" | "waku";
  text: string;
}

interface TranscriptProps {
  entries: TranscriptEntry[];
  /** Ids of user entries that can still be corrected (last two). */
  editableIds?: string[];
  onEdit?: (id: string, text: string) => void;
}

export function Transcript({ entries, editableIds = [], onEdit }: TranscriptProps) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-4">
      {entries.map((entry) =>
        entry.role === "user" ? (
          <div key={entry.id} className="group flex items-center justify-end gap-2">
            {onEdit && editableIds.includes(entry.id) && (
              <button
                type="button"
                aria-label="Edit this answer"
                title="Edit this answer"
                onClick={() => onEdit(entry.id, entry.text)}
                className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-brand-soft hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Pencil className="size-3.5" />
              </button>
            )}
            <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
              {entry.text}
            </div>
          </div>
        ) : (
          <div key={entry.id} className="flex">
            <p className="max-w-[85%] whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {entry.text}
            </p>
          </div>
        ),
      )}
    </div>
  );
}

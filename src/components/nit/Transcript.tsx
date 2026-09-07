export interface TranscriptEntry {
  id: string;
  role: "user" | "waku";
  text: string;
}

export function Transcript({ entries }: { entries: TranscriptEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      {entries.map((entry) =>
        entry.role === "user" ? (
          <div key={entry.id} className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
              {entry.text}
            </div>
          </div>
        ) : (
          <div key={entry.id} className="flex">
            <p className="max-w-[85%] text-sm leading-relaxed text-muted-foreground">
              {entry.text}
            </p>
          </div>
        ),
      )}
    </div>
  );
}

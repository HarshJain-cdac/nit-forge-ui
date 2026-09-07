import { useRef, useState } from "react";
import { FileText, RefreshCcw, Upload, X, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { uploadFile } from "@/lib/waku-api";
import { formatFileSize, type UploadedFileInfo } from "@/lib/waku-types";

interface FileUploadFieldProps {
  sessionId: string | null;
  fieldKey?: string | undefined;
  disabled?: boolean;
  onUploaded: (fileId: string | undefined, file: UploadedFileInfo) => void;
  onCleared: () => void;
}

export function FileUploadField({
  sessionId,
  fieldKey,
  disabled,
  onUploaded,
  onCleared,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [info, setInfo] = useState<UploadedFileInfo | null>(null);

  async function handleFile(file: File) {
    const base: UploadedFileInfo = {
      name: file.name,
      type: file.type || "unknown",
      size: file.size,
      status: "uploading",
      progress: 0,
    };
    setInfo(base);

    try {
      const result = await uploadFile(sessionId, file, fieldKey, (progress) =>
        setInfo((prev) => (prev ? { ...prev, progress } : prev)),
      );
      const status: UploadedFileInfo["status"] =
        result.status === "processing"
          ? "processing"
          : result.status === "failed"
            ? "failed"
            : "verified";
      const next: UploadedFileInfo = {
        ...base,
        progress: 100,
        status,
        file_id: result.file_id,
        message: result.message,
      };
      setInfo(next);
      if (status !== "failed") onUploaded(result.file_id, next);
    } catch (error) {
      setInfo({
        ...base,
        progress: 100,
        status: "failed",
        message: error instanceof Error ? error.message : "Upload failed.",
      });
      onCleared();
    }
  }

  function clear() {
    setInfo(null);
    if (inputRef.current) inputRef.current.value = "";
    onCleared();
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {!info ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-brand-softer px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-brand-soft disabled:opacity-60"
        >
          <Upload className="size-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Upload a document</span>
          <span className="text-xs text-muted-foreground">
            Click to browse and select a file
          </span>
        </button>
      ) : (
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft">
              <FileText className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{info.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {info.type} · {formatFileSize(info.size)}
              </p>

              {info.status === "uploading" && (
                <div className="mt-3 space-y-1.5">
                  <Progress value={info.progress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">Uploading {info.progress}%</p>
                </div>
              )}

              {info.status === "processing" && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-primary">
                  <Loader2 className="size-3.5 animate-spin" /> Processing document…
                </p>
              )}

              {info.status === "verified" && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-primary">
                  <CheckCircle2 className="size-3.5" /> {info.message ?? "Uploaded"}
                </p>
              )}

              {info.status === "failed" && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="size-3.5" /> {info.message ?? "Upload failed"}
                </p>
              )}
            </div>

            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Replace file"
                onClick={() => inputRef.current?.click()}
              >
                <RefreshCcw className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove file"
                onClick={clear}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

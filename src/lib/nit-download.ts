import { humanizeKey, renderValue } from "@/lib/render-value";
import type { NitData } from "@/components/nit/NitDocument";

/** Builds a printable HTML file from the backend-provided NiT data. */
export function downloadNit(data: NitData) {
  const rows = Object.entries(data.fields)
    .map(
      ([key, value]) =>
        `<tr><th>${escapeHtml(humanizeKey(key))}</th><td>${escapeHtml(renderValue(value))}</td></tr>`,
    )
    .join("");

  const annexure = data.annexure_items
    .map((item) => `<li>${escapeHtml(renderValue(item))}</li>`)
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Notice Inviting Tender</title>
<style>body{font-family:Georgia,serif;color:#12203c;margin:48px;line-height:1.6}
h1{text-align:center;font-size:20px;letter-spacing:.08em;text-transform:uppercase}
table{width:100%;border-collapse:collapse;margin-top:24px}
th,td{border-bottom:1px solid #dbe3f4;padding:10px;text-align:left;vertical-align:top;font-size:14px}
th{width:32%;color:#4a5a7a;font-weight:600}
h2{margin-top:32px;font-size:14px;text-transform:uppercase;color:#1d4ed8}</style>
</head><body><h1>Notice Inviting Tender</h1><table>${rows}</table>
${annexure ? `<h2>Annexure</h2><ol>${annexure}</ol>` : ""}</body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `NIT-${data.session_id || "document"}.html`;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

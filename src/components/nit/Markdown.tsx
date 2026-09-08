import type { ReactNode } from "react";

/** Renders inline markdown: **bold**, *italic*, `code`. */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={key} className="rounded bg-brand-soft px-1 py-0.5 text-[0.85em]">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Minimal markdown renderer: paragraphs, bullet lists, bold/italic/code. */
export function Markdown({ text, className }: { text: string; className?: string }) {
  const lines = text.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  let paragraph: string[] = [];

  const flushBullets = (key: string) => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={key} className="ml-4 list-disc space-y-1">
        {bullets.map((item, i) => (
          <li key={i}>{inline(item, `${key}-${i}`)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  const flushParagraph = (key: string) => {
    if (paragraph.length === 0) return;
    blocks.push(<p key={key}>{inline(paragraph.join("\n"), key)}</p>);
    paragraph = [];
  };

  lines.forEach((raw, index) => {
    const line = raw.trimEnd();
    const bullet = /^\s*([-*•]|\d+\.)\s+(.*)$/.exec(line);
    if (bullet) {
      flushParagraph(`p-${index}`);
      bullets.push(bullet[2] ?? "");
      return;
    }
    if (!line.trim()) {
      flushBullets(`ul-${index}`);
      flushParagraph(`p-${index}`);
      return;
    }
    flushBullets(`ul-${index}`);
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph(`p-${index}`);
      blocks.push(
        <p key={`h-${index}`} className="font-semibold text-foreground">
          {inline(heading[1] ?? "", `h-${index}`)}
        </p>,
      );
      return;
    }
    paragraph.push(line);
  });

  flushBullets("ul-end");
  flushParagraph("p-end");

  return <div className={className ? `space-y-2 ${className}` : "space-y-2"}>{blocks}</div>;
}

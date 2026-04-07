import React from "react";

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Split by **bold** segments
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <strong key={`${keyPrefix}-b-${i++}`} className="text-[#81ecff] font-semibold">
        {match[1]}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const out: React.ReactNode[] = [];

  type ListItem = { ordered: boolean; text: string };
  let listBuf: ListItem[] = [];
  let listOrdered = false;

  const flushList = (key: string) => {
    if (listBuf.length === 0) return;
    if (listOrdered) {
      out.push(
        <ol key={key} className="list-decimal pl-5 space-y-1 my-2 text-white">
          {listBuf.map((it, i) => (
            <li key={i}>{renderInline(it.text, `${key}-${i}`)}</li>
          ))}
        </ol>
      );
    } else {
      out.push(
        <ul key={key} className="list-disc pl-5 space-y-1 my-2 text-white">
          {listBuf.map((it, i) => (
            <li key={i}>{renderInline(it.text, `${key}-${i}`)}</li>
          ))}
        </ul>
      );
    }
    listBuf = [];
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trimEnd();
    const key = `l-${idx}`;

    if (line.trim() === "") {
      flushList(`${key}-list`);
      out.push(<div key={key} className="h-2" />);
      return;
    }

    const h2 = line.match(/^##\s+(.*)$/);
    const h3 = line.match(/^###\s+(.*)$/);
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    const ul = line.match(/^\s*[-*]\s+(.*)$/);

    if (h3) {
      flushList(`${key}-list`);
      out.push(
        <h3 key={key} className="text-base font-semibold text-white mt-3 mb-1">
          {renderInline(h3[1], key)}
        </h3>
      );
      return;
    }
    if (h2) {
      flushList(`${key}-list`);
      out.push(
        <h2 key={key} className="text-lg font-bold text-[#81ecff] mt-4 mb-2">
          {renderInline(h2[1], key)}
        </h2>
      );
      return;
    }
    if (ol) {
      if (listBuf.length > 0 && !listOrdered) flushList(`${key}-list`);
      listOrdered = true;
      listBuf.push({ ordered: true, text: ol[1] });
      return;
    }
    if (ul) {
      if (listBuf.length > 0 && listOrdered) flushList(`${key}-list`);
      listOrdered = false;
      listBuf.push({ ordered: false, text: ul[1] });
      return;
    }

    flushList(`${key}-list`);
    out.push(
      <p key={key} className="text-sm text-white leading-relaxed my-1">
        {renderInline(line, key)}
      </p>
    );
  });

  flushList("final-list");

  return <div className="space-y-0.5">{out}</div>;
}

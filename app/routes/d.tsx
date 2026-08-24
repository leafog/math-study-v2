import { streamingMarkdownExtension } from "@tanstack/markdown/extensions/streaming";
import { Markdown } from "@tanstack/markdown/react";
import { useEffect, useState } from "react";

const streamingExtensions = [streamingMarkdownExtension()];
const response = [
  "# Release summary",
  "",
  "The parser safely renders **accumulated text** as it arrives.",
  "",
  "- No incremental parser state",
  "- Incomplete blocks stay predictable",
  "",
  "```ts",
  "const status = 'streaming'",
  "```",
].join("\n");

export default function Response() {
  const [length, setLength] = useState(0);

  useEffect(() => {
    if (length >= response.length) return;
    const timeout = window.setTimeout(
      () => setLength((value) => value + 1),
      18,
    );
    return () => window.clearTimeout(timeout);
  }, [length]);

  return (
    <main className="typeset typeset-chat">
      <button type="button" onClick={() => setLength(0)}>
        Replay
      </button>
      <Markdown
        extensions={streamingExtensions}
        frontmatter={false}
        headingIds={false}
      >
        {response.slice(0, length)}
      </Markdown>
    </main>
  );
}

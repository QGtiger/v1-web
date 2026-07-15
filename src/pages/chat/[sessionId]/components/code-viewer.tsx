import { useShikiHighlighter } from "react-shiki";
import { FileIcon } from "lucide-react";

export function CodeViewer({
  code,
  language,
  fileName,
}: {
  code: string;
  language: string;
  fileName?: string;
}) {
  const highlighted = useShikiHighlighter(code, language, "github-light");

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      {fileName && (
        <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-border/50 px-3 text-xs text-muted-foreground">
          <FileIcon className="size-3" />
          <span className="truncate font-mono">{fileName}</span>
        </div>
      )}
      <div className="code-scroll flex-1 overflow-auto bg-muted/30">
        <pre className="p-4 text-xs leading-relaxed">
          <code>{highlighted}</code>
        </pre>
      </div>
    </div>
  );
}

export function CodeViewerEmpty() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground/40">
      <FileIcon className="size-8" />
      <span className="text-xs">Select a file to view</span>
    </div>
  );
}

export function CodeViewerLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
    </div>
  );
}

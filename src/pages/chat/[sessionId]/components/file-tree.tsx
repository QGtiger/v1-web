/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { useRequest } from "ahooks";
import { FolderIcon, FileIcon, ChevronRightIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { OpencodeClient } from "@assistant-ui/react-opencode";

type FileNode = {
  name: string;
  path: string;
  type: "file" | "directory";
  ignored: boolean;
};

const HIDDEN_NAMES = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "build",
  ".cache",
  ".turbo",
  ".svelte-kit",
  ".vercel",
  ".DS_Store",
]);

function filterNodes(nodes: FileNode[]): FileNode[] {
  return nodes.filter(
    (n) => !n.ignored && !HIDDEN_NAMES.has(n.name),
  );
}

function sortNodes(nodes: FileNode[]): FileNode[] {
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function extToLang(ext: string): string {
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    json: "json",
    css: "css",
    html: "html",
    md: "markdown",
    vue: "vue",
    yaml: "yaml",
    yml: "yaml",
    sh: "bash",
    bash: "bash",
  };
  return map[ext] ?? "text";
}

export function getLangFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return extToLang(ext);
}

function TreeNode({
  node,
  client,
  depth,
  onSelect,
  selectedPath,
}: {
  node: FileNode;
  client: OpencodeClient;
  depth: number;
  onSelect: (path: string) => void;
  selectedPath?: string;
}) {
  const [open, setOpen] = useState(false);
  const isSelected = selectedPath === node.path;

  if (node.type === "file") {
    return (
      <button
        onClick={() => onSelect(node.path)}
        className={cn(
          "flex w-full items-center gap-1.5 rounded px-1.5 py-0.5 text-left text-xs transition-colors",
          isSelected
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
        )}
        style={{ paddingLeft: depth * 12 + 6 }}
      >
        <FileIcon className="size-3 shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-left text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        style={{ paddingLeft: depth * 12 + 6 }}
      >
        <ChevronRightIcon
          className={cn(
            "size-3 shrink-0 transition-transform",
            open && "rotate-90",
          )}
        />
        <FolderIcon className="size-3 shrink-0" />
        <span className="truncate">{node.name}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {open && (
          <LazyDirContent
            client={client}
            path={node.path}
            depth={depth + 1}
            onSelect={onSelect}
            selectedPath={selectedPath}
          />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function LazyDirContent({
  client,
  path,
  depth,
  onSelect,
  selectedPath,
}: {
  client: OpencodeClient;
  path: string;
  depth: number;
  onSelect: (path: string) => void;
  selectedPath?: string;
}) {
  const { data, loading } = useRequest(
    async () => {
      const res = await client.file.list({ path });
      return (res.data as FileNode[]) ?? [];
    },
    { cacheKey: `file-list-${path}` },
  );

  if (loading) {
    return (
      <div className="py-1 text-xs text-muted-foreground/50" style={{ paddingLeft: depth * 12 + 6 }}>
        Loading...
      </div>
    );
  }

  const nodes = sortNodes(filterNodes(data ?? []));

  return (
    <div>
      {nodes.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          client={client}
          depth={depth}
          onSelect={onSelect}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
}

export function FileTree({
  client,
  onSelect,
  selectedPath,
}: {
  client: OpencodeClient;
  onSelect: (path: string) => void;
  selectedPath?: string;
}) {
  const { data, loading } = useRequest(
    async () => {
      const res = await client.file.list({ path: "." });
      return (res.data as FileNode[]) ?? [];
    },
    { cacheKey: "file-list-root" },
  );

  if (loading) {
    return (
      <div className="p-2 text-xs text-muted-foreground/50">Loading...</div>
    );
  }

  const nodes = sortNodes(filterNodes(data ?? []));

  return (
    <div className="flex flex-col gap-0.5 p-1">
      {nodes.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          client={client}
          depth={0}
          onSelect={onSelect}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
}

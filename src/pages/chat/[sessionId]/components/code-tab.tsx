import { useMemo, useState } from "react";
import { useRequest } from "ahooks";
import { useOpenCodeClient } from "@/components/opencode/client-context";
import { useOpenCodeThreadState } from "@assistant-ui/react-opencode";
import { FileTree, getLangFromPath } from "./file-tree";
import { CodeViewer, CodeViewerEmpty, CodeViewerLoading } from "./code-viewer";

type FileContent = {
  type: "text" | "binary";
  content: string;
};

export function CodeTab() {
  const client = useOpenCodeClient();
  const [selectedPath, setSelectedPath] = useState<string>();

  const messageOrder = useOpenCodeThreadState((s) => s.messageOrder);
  const messagesById = useOpenCodeThreadState((s) => s.messagesById);

  const lastToolEditAt = useMemo(() => {
    let latest = 0;
    for (let i = messageOrder.length - 1; i >= 0; i--) {
      const message = messagesById[messageOrder[i]];
      if (!message) continue;
      for (let j = message.parts.length - 1; j >= 0; j--) {
        const part = message.parts[j];
        if (part.type !== "tool") continue;
        if (part.tool !== "edit" && part.tool !== "write") continue;
        const state = part.state as {
          status?: string;
          input?: { filePath?: string };
          time?: { end?: number };
        };
        if (state.status !== "completed") continue;
        const filePath = state.input?.filePath;
        if (!filePath) continue;
        if (filePath === selectedPath || filePath.endsWith("/" + selectedPath)) {
          const endedAt = state.time?.end ?? 0;
          if (endedAt > latest) latest = endedAt;
        }
      }
    }
    return latest;
  }, [messageOrder, messagesById, selectedPath]);

  const { data, loading } = useRequest(
    async () => {
      if (!selectedPath) return null;
      const res = await client.file.read({ path: selectedPath });
      return res.data as FileContent;
    },
    { refreshDeps: [selectedPath, lastToolEditAt] },
  );

  return (
    <div className="flex h-full overflow-hidden">
      <div className="code-scroll w-[200px] shrink-0 overflow-y-auto border-r border-border/50">
        <FileTree
          client={client}
          onSelect={setSelectedPath}
          selectedPath={selectedPath}
        />
      </div>
      <div className="relative flex-1 overflow-hidden">
        {!selectedPath ? (
          <CodeViewerEmpty />
        ) : loading ? (
          <CodeViewerLoading />
        ) : data?.type === "binary" ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Binary file
          </div>
        ) : data ? (
          <CodeViewer
            code={data.content}
            language={getLangFromPath(selectedPath)}
            fileName={selectedPath.split("/").pop()}
          />
        ) : (
          <CodeViewerEmpty />
        )}
      </div>
    </div>
  );
}

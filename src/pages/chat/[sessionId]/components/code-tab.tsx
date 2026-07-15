import { useState } from "react";
import { useRequest } from "ahooks";
import { useOpenCodeClient } from "@/components/opencode/client-context";
import { FileTree, getLangFromPath } from "./file-tree";
import { CodeViewer, CodeViewerEmpty, CodeViewerLoading } from "./code-viewer";

type FileContent = {
  type: "text" | "binary";
  content: string;
};

export function CodeTab() {
  const client = useOpenCodeClient();
  const [selectedPath, setSelectedPath] = useState<string>();

  const { data, loading } = useRequest(
    async () => {
      if (!selectedPath) return null;
      const res = await client.file.read({ path: selectedPath });
      return res.data as FileContent;
    },
    { refreshDeps: [selectedPath] },
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

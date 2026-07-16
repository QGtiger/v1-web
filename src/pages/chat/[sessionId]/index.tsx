import { RuntimeProvider } from "./RuntimeProvider";
import { WorkspaceProvider } from "./model";
import { Thread } from "@/components/assistant-ui/thread";
import { WorkspacePanel } from "./components/workspace-panel";
import { ChatHeader } from "./components/chat-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useParams } from "react-router-dom";
import { useRequest } from "ahooks";
import { serverApi } from "@/models";
import { LoaderIcon } from "lucide-react";
import { Panel, Group, Separator } from "react-resizable-panels";
// import { useEffect, useRef } from "react";

type WorkspaceInfo = {
  sessionId: string;
  directory: string;
  previewPort: number;
  previewUrl: string;
};

export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const { data, loading } = useRequest(
    async () => {
      const res = await serverApi.get<WorkspaceInfo>(
        `/api/workspaces/${sessionId}`,
      );
      return res.data;
    },
    { refreshDeps: [sessionId] },
  );

  // 退出会话页时停掉 vite 预览释放内存。
  // StrictMode 下双挂载会触发模拟卸载，用 aliveRef + microtask 确保只在真正卸载时调一次。
  // const aliveRef = useRef(true);
  // useEffect(() => {
  //   aliveRef.current = true;
  //   return () => {
  //     aliveRef.current = false;
  //     queueMicrotask(() => {
  //       // 重新挂载（StrictMode 模拟卸载）会把 aliveRef 置回 true → 跳过
  //       if (aliveRef.current || !sessionId) return;
  //       serverApi.post(`/api/workspaces/${sessionId}/stop`).catch(() => {});
  //     });
  //   };
  // }, [sessionId]);

  if (!sessionId) return null;

  if (loading || !data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderIcon className="size-5 animate-spin text-muted-foreground [animation-duration:0.8s]" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <WorkspaceProvider value={sessionId}>
        <RuntimeProvider sessionId={sessionId} directory={data.directory}>
          <Group orientation="horizontal" className="h-screen overflow-hidden">
            <Panel defaultSize={40} minSize={25}>
              <div className="relative flex h-screen flex-col overflow-hidden">
                <ChatHeader />
                <div className="flex-1 overflow-hidden text-sm">
                  <Thread />
                </div>
                <div className="pointer-events-none absolute inset-x-0 top-12 z-10 h-6 bg-gradient-to-b from-background to-transparent" />
              </div>
            </Panel>
            <Separator
              className="w-1 cursor-col-resize opacity-0 transition-opacity duration-200 hover:opacity-100 active:opacity-100"
              style={{
                background:
                  "linear-gradient(180deg, transparent 5%, rgba(57, 139, 255, 0.5) 50%, transparent 95%)",
              }}
            />
            <Panel defaultSize={60} minSize={30}>
              <div className="h-full overflow-hidden border-l border-border ">
                <WorkspacePanel />
              </div>
            </Panel>
          </Group>
        </RuntimeProvider>
      </WorkspaceProvider>
    </TooltipProvider>
  );
}

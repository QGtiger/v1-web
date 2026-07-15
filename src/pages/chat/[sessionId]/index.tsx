import { RuntimeProvider } from "./RuntimeProvider";
import { Thread } from "@/components/assistant-ui/thread";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useParams } from "react-router-dom";
import { useRequest } from "ahooks";
import { serverApi } from "@/pages/models";
import { LoaderIcon } from "lucide-react";

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
      <RuntimeProvider sessionId={sessionId} directory={data.directory}>
        <div className="h-screen w-full">
          <Thread />
        </div>
      </RuntimeProvider>
    </TooltipProvider>
  );
}

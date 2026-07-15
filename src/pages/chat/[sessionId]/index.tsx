import { RuntimeProvider } from "./RuntimeProvider";
import { Thread } from "@/components/assistant-ui/thread";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useParams } from "react-router-dom";

export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  if (!sessionId) return null;

  return (
    <TooltipProvider>
      <RuntimeProvider sessionId={sessionId}>
        <div className="h-screen w-full">
          <Thread />
        </div>
      </RuntimeProvider>
    </TooltipProvider>
  );
}

import { RuntimeProvider } from "./RuntimeProvider";
import { Thread } from "@/components/assistant-ui/thread";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useParams, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useThreadRuntime } from "@assistant-ui/react";

function AutoSend({ message }: { message?: string }) {
  const runtime = useThreadRuntime();
  const sent = useRef(false);

  useEffect(() => {
    if (message && !sent.current) {
      sent.current = true;
      runtime.append({
        role: "user",
        content: [{ type: "text", text: message }],
      });
    }
  }, [message, runtime]);

  return null;
}

export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const initialMessage = (location.state as { initialMessage?: string })
    ?.initialMessage;

  if (!sessionId) return null;

  return (
    <TooltipProvider>
      <RuntimeProvider sessionId={sessionId}>
        <AutoSend message={initialMessage} />
        <div className="h-screen w-full">
          <Thread />
        </div>
      </RuntimeProvider>
    </TooltipProvider>
  );
}

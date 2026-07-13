import { OPENCODE_BASE_URL } from "@/pages/constant";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useOpenCodeRuntime } from "@assistant-ui/react-opencode";

export function RuntimeProvider({
  sessionId,
  children,
}: {
  sessionId: string;
  children: React.ReactNode;
}) {
  const runtime = useOpenCodeRuntime({
    baseUrl: OPENCODE_BASE_URL,
    initialSessionId: sessionId,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}

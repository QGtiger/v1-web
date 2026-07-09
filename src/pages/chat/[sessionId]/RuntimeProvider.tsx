import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useOpenCodeRuntime } from "@assistant-ui/react-opencode";

const OPENCODE_BASE_URL = "http://localhost:55033";

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

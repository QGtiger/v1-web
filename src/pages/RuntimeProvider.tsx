import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useOpenCodeRuntime } from "@assistant-ui/react-opencode";

export function RuntimeProvider({ children }: { children: React.ReactNode }) {
  const runtime = useOpenCodeRuntime({
    baseUrl: "http://localhost:55033",
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}

import { opencodeClient } from "@/pages/models";
import { TodoWriteToolUI } from "@/components/opencode/todowrite-tool-ui";
import { QuestionToolUI } from "@/components/opencode/question-tool-ui";
import { EditToolUI } from "@/components/opencode/edit-tool-ui";
import { WriteToolUI } from "@/components/opencode/write-tool-ui";
import { TaskToolUI } from "@/components/opencode/task-tool-ui";
import { OpenCodeClientContext } from "@/components/opencode/client-context";
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
    client: opencodeClient,
    initialSessionId: sessionId,
  });

  return (
    <OpenCodeClientContext.Provider value={opencodeClient}>
      <AssistantRuntimeProvider runtime={runtime}>
        <TodoWriteToolUI />
        <QuestionToolUI />
        <EditToolUI />
        <WriteToolUI />
        <TaskToolUI />
        {children}
      </AssistantRuntimeProvider>
    </OpenCodeClientContext.Provider>
  );
}

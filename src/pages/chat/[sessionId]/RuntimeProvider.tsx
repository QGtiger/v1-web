import { OPENCODE_BASE_URL } from "@/pages/constant";
import { TodoWriteToolUI } from "@/components/opencode/todowrite-tool-ui";
import { QuestionToolUI } from "@/components/opencode/question-tool-ui";
import { EditToolUI } from "@/components/opencode/edit-tool-ui";
import { WriteToolUI } from "@/components/opencode/write-tool-ui";
import { TaskToolUI } from "@/components/opencode/task-tool-ui";
import { OpenCodeClientContext } from "@/components/opencode/client-context";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  createOpencodeClient,
  useOpenCodeRuntime,
} from "@assistant-ui/react-opencode";
import { useMemo } from "react";

export function RuntimeProvider({
  sessionId,
  children,
}: {
  sessionId: string;
  children: React.ReactNode;
}) {
  const client = useMemo(
    () => createOpencodeClient({ baseUrl: OPENCODE_BASE_URL }),
    [],
  );
  const runtime = useOpenCodeRuntime({
    client,
    initialSessionId: sessionId,
  });

  return (
    <OpenCodeClientContext.Provider value={client}>
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

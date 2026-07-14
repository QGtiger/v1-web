import { useMemo } from "react";
import { useOpenCodeThreadState } from "@assistant-ui/react-opencode";

export type OpenCodeTodo = {
  content: string;
  status: string;
  priority: string;
};

export function useOpenCodeTodos() {
  const messageOrder = useOpenCodeThreadState((s) => s.messageOrder);
  const messagesById = useOpenCodeThreadState((s) => s.messagesById);

  const todos = useMemo(() => {
    for (let i = messageOrder.length - 1; i >= 0; i--) {
      const message = messagesById[messageOrder[i]];
      if (!message) continue;
      for (let j = message.parts.length - 1; j >= 0; j--) {
        const part = message.parts[j];
        if (part.type === "tool" && part.tool === "todowrite") {
          const state = part.state as {
            input?: { todos?: OpenCodeTodo[] };
          };
          const found = state.input?.todos;
          if (found !== undefined) {
            return found;
          }
        }
      }
    }
    return [];
  }, [messageOrder, messagesById]);

  return { todos };
}

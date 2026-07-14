import { makeAssistantToolUI } from "@assistant-ui/react";
import { ListTodo } from "lucide-react";

type TodoWriteArgs = {
  todos?: Array<{ content?: string; status?: string }>;
};

export const TodoWriteToolUI = makeAssistantToolUI({
  toolName: "todowrite",
  render: ({ args, status }) => {
    const todoArgs = args as TodoWriteArgs;
    const todos = todoArgs?.todos ?? [];
    const completed = todos.filter(
      (t) => t.status === "completed" || t.status === "cancelled",
    ).length;
    const total = todos.length;
    const isRunning = status?.type === "running";

    return (
      <div className="flex items-center gap-1.5 py-0.5 text-xs text-muted-foreground">
        <ListTodo className="size-3.5" />
        {isRunning ? (
          <span>Updating todo list…</span>
        ) : (
          <span>
            Updated todo list
            {total > 0 && (
              <span className="ml-1 text-muted-foreground/70">
                ({completed}/{total} done)
              </span>
            )}
          </span>
        )}
      </div>
    );
  },
});

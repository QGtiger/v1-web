import { useOpenCodeTodos, type OpenCodeTodo } from "@/hooks/useOpenCodeTodos";
import { CheckCircle2, Circle, XCircle, Loader2 } from "lucide-react";

const statusConfig: Record<
  string,
  { icon: typeof Circle; className: string }
> = {
  pending: { icon: Circle, className: "text-muted-foreground" },
  in_progress: {
    icon: Loader2,
    className: "text-blue-500 animate-spin",
  },
  completed: { icon: CheckCircle2, className: "text-green-500" },
  cancelled: { icon: XCircle, className: "text-muted-foreground" },
};

const priorityConfig: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function TodoItem({ todo }: { todo: OpenCodeTodo }) {
  const config = statusConfig[todo.status] ?? statusConfig.pending;
  const Icon = config.icon;
  const priorityClass = priorityConfig[todo.priority] ?? priorityConfig.low;
  const isDone = todo.status === "completed" || todo.status === "cancelled";

  return (
    <div className="flex items-start gap-2 py-1">
      <Icon className={`mt-0.5 size-4 shrink-0 ${config.className}`} />
      <div className="min-w-0 flex-1">
        <span
          className={`text-sm ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}
        >
          {todo.content}
        </span>
        {todo.priority && todo.priority !== "low" && (
          <span
            className={`ml-2 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${priorityClass}`}
          >
            {todo.priority}
          </span>
        )}
      </div>
    </div>
  );
}

export function TodoPanel() {
  const { todos } = useOpenCodeTodos();

  if (todos.length === 0) return null;
  if (todos.every((t) => t.status === "completed" || t.status === "cancelled"))
    return null;

  const completed = todos.filter((t) => t.status === "completed").length;

  return (
    <div className="border-b">
      <div
        className="mx-auto w-full max-w-(--thread-max-width) px-4 py-2"
        style={{ ["--thread-max-width" as string]: "44rem" }}
      >
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Todo
          </span>
          <span className="text-xs text-muted-foreground">
            {completed}/{todos.length}
          </span>
        </div>
        <div className="max-h-40 overflow-y-auto">
          {todos.map((todo, i) => (
            <TodoItem key={i} todo={todo} />
          ))}
        </div>
      </div>
    </div>
  );
}

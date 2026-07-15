import { useOpenCodeSession } from "@assistant-ui/react-opencode";
import { useIsThreadLoading } from "@/models";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";

export function ChatHeader() {
  const session = useOpenCodeSession();
  const isLoading = useIsThreadLoading();
  const navigate = useNavigate();

  return (
    <div className="flex h-12 shrink-0 items-center gap-2 px-3">
      <button
        onClick={() => navigate("/")}
        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
      </button>
      {isLoading ? (
        <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
      ) : (
        <span className="truncate text-sm font-medium text-foreground">
          {session?.title || "New session"}
        </span>
      )}
    </div>
  );
}

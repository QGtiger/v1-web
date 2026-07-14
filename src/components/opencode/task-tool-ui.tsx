import { makeAssistantToolUI } from "@assistant-ui/react";
import {
  BotIcon,
  CheckIcon,
  LoaderIcon,
  ChevronDownIcon,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type TaskArgs = {
  description?: string;
  prompt?: string;
  subagent_type?: string;
};

export const TaskToolUI = makeAssistantToolUI({
  toolName: "task",
  render: ({ args, result, status }) => {
    const taskArgs = args as TaskArgs;
    const description = taskArgs?.description ?? "";
    const prompt = taskArgs?.prompt ?? "";
    const subagentType = taskArgs?.subagent_type ?? "";
    const isRunning = status?.type === "running";
    const isDone = status?.type === "complete";
    const resultStr =
      typeof result === "string" ? result : result ? String(result) : "";

    return (
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger
          className={cn(
            "group/trigger text-muted-foreground hover:text-foreground flex w-fit origin-left items-center gap-1.5 py-0.5 text-sm transition-[color,scale] active:scale-[0.98]",
          )}
        >
          <BotIcon className="size-3.5 shrink-0" />
          <span className="font-mono text-xs">
            <span className="text-muted-foreground">task</span>
            {description && (
              <span className="text-foreground/70 ml-1.5">{description}</span>
            )}
          </span>
          {isRunning && (
            <LoaderIcon className="size-3 shrink-0 animate-spin [animation-duration:0.6s]" />
          )}
          {isDone && (
            <CheckIcon className="size-3 shrink-0 text-green-500" />
          )}
          <ChevronDownIcon
            className={cn(
              "size-3 shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
              "group-data-[state=closed]/trigger:-rotate-90",
              "group-data-[state=open]/trigger:rotate-0",
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down mt-1 overflow-hidden">
          <div className="rounded-md border border-border">
            {subagentType && (
              <div className="border-b border-border px-3 py-1.5">
                <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {subagentType}
                </span>
              </div>
            )}
            {prompt && (
              <div className="border-b border-border px-3 py-2">
                <div className="mb-1 text-xs font-medium text-muted-foreground/60">
                  Prompt
                </div>
                <p className="whitespace-pre-wrap text-xs text-muted-foreground/80 line-clamp-4">
                  {prompt}
                </p>
              </div>
            )}
            <div className="px-3 py-2">
              <div className="mb-1 text-xs font-medium text-muted-foreground/60">
                {isRunning ? "Running…" : "Result"}
              </div>
              {resultStr ? (
                <div className="max-h-80 overflow-y-auto whitespace-pre-wrap text-xs text-foreground/80">
                  {resultStr}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground/50">
                  {isRunning
                    ? "Subagent is working…"
                    : "No output"}
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
});

import { makeAssistantToolUI } from "@assistant-ui/react";
import {
  FilePlusIcon,
  CheckIcon,
  LoaderIcon,
  ChevronDownIcon,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DiffViewer } from "@/components/assistant-ui/diff-viewer";
import { cn } from "@/lib/utils";

type WriteArgs = {
  filePath?: string;
  content?: string;
};

export const WriteToolUI = makeAssistantToolUI({
  toolName: "write",
  render: ({ args, status }) => {
    const writeArgs = args as WriteArgs;
    const filePath = writeArgs?.filePath ?? "";
    const content = writeArgs?.content ?? "";
    const isRunning = status?.type === "running";
    const isDone = status?.type === "complete";

    return (
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger className="group/trigger text-muted-foreground hover:text-foreground flex w-fit origin-left items-center gap-1.5 py-0.5 text-sm transition-[color,scale] active:scale-[0.98]">
          <FilePlusIcon className="size-3.5 shrink-0" />
          <span className="font-mono text-xs">
            <span className="text-muted-foreground">write</span>
            {filePath && (
              <span className="text-foreground/70 ml-1.5">{filePath}</span>
            )}
          </span>
          {isRunning && (
            <LoaderIcon className="size-3 shrink-0 animate-spin [animation-duration:0.6s]" />
          )}
          {isDone && <CheckIcon className="size-3 shrink-0 text-green-500" />}
          <ChevronDownIcon
            className={cn(
              "size-3 shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
              "group-data-[state=closed]/trigger:-rotate-90",
              "group-data-[state=open]/trigger:rotate-0",
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down mt-1 overflow-hidden">
          {content ? (
            <DiffViewer
              oldFile={{ content: "", name: filePath }}
              newFile={{ content, name: filePath }}
              viewMode="unified"
              size="sm"
            />
          ) : (
            <div className="py-2 px-3 text-xs text-muted-foreground">
              Waiting for content…
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    );
  },
});

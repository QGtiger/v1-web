import { makeAssistantToolUI } from "@assistant-ui/react";
import { FilePenIcon, CheckIcon, LoaderIcon, ChevronDownIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DiffViewer } from "@/components/assistant-ui/diff-viewer";
import { cn } from "@/lib/utils";

type EditArgs = {
  filePath?: string;
  oldString?: string;
  newString?: string;
};

export const EditToolUI = makeAssistantToolUI({
  toolName: "edit",
  render: ({ args, status }) => {
    const editArgs = args as EditArgs;
    const filePath = editArgs?.filePath ?? "";
    const oldStr = editArgs?.oldString ?? "";
    const newStr = editArgs?.newString ?? "";
    const isRunning = status?.type === "running";
    const isDone = status?.type === "complete";
    const hasContent = oldStr || newStr;

    return (
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger
          className="group/trigger text-muted-foreground hover:text-foreground flex w-fit origin-left items-center gap-1.5 py-0.5 text-sm transition-[color,scale] active:scale-[0.98]"
        >
          <FilePenIcon className="size-3.5 shrink-0" />
          <span className="font-mono text-xs">
            <span className="text-muted-foreground">edit</span>
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
          {hasContent ? (
            <DiffViewer
              oldFile={{ content: oldStr, name: filePath }}
              newFile={{ content: newStr, name: filePath }}
              viewMode="split"
              size="sm"
            />
          ) : (
            <div className="text-xs text-muted-foreground py-2 px-3">
              Waiting for content…
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    );
  },
});

/* eslint-disable react-refresh/only-export-components */
import { makeAssistantToolUI } from "@assistant-ui/react";
import { useOpenCodeQuestions } from "@assistant-ui/react-opencode";
import { MessageSquareIcon, ChevronDownIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type QuestionInfo = {
  question: string;
  header: string;
  options: Array<{ label: string; description: string }>;
  multiple?: boolean;
  custom?: boolean;
};

type QuestionArgs = {
  questions?: QuestionInfo[];
};

function tryParseAnswers(result: unknown): string[][] | null {
  if (typeof result !== "string") return null;
  try {
    const parsed = JSON.parse(result);
    if (
      Array.isArray(parsed) &&
      parsed.every((a) => Array.isArray(a) && a.every((v) => typeof v === "string"))
    ) {
      return parsed as string[][];
    }
  } catch {
    // result is not JSON
  }
  return null;
}

function QASummary({
  questions,
  answers,
  rawResult,
}: {
  questions: QuestionInfo[];
  answers: string[][] | null;
  rawResult?: unknown;
}) {
  const rawStr =
    typeof rawResult === "string" && rawResult.trim() ? rawResult.trim() : null;

  return (
    <Collapsible defaultOpen={false}>
      <CollapsibleTrigger className="group/trigger text-muted-foreground hover:text-foreground flex w-fit origin-left items-center gap-1.5 py-0.5 text-sm transition-[color,scale] active:scale-[0.98]">
        <MessageSquareIcon className="size-3.5 shrink-0" />
        <span className="font-mono text-xs">
          <span className="text-muted-foreground">question</span>
          <span className="text-foreground/70 ml-1.5">
            answered {questions.length}{" "}
            {questions.length === 1 ? "question" : "questions"}
          </span>
        </span>
        <ChevronDownIcon
          className={cn(
            "size-3 shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
            "group-data-[state=closed]/trigger:-rotate-90",
            "group-data-[state=open]/trigger:rotate-0",
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down mt-1 overflow-hidden">
        <div className="flex flex-col gap-1.5 rounded-md border border-border p-2.5 text-xs">
          {questions.map((q, i) => {
            const answer = answers?.[i];
            return (
              <div key={i} className="flex gap-2">
                <span className="shrink-0 font-medium text-muted-foreground">
                  {q.header}
                </span>
                <span className="text-foreground/80">
                  {answer && answer.length > 0
                    ? answer.join(", ")
                    : "—"}
                </span>
              </div>
            );
          })}
          {!answers && rawStr && (
            <div className="mt-1 border-t border-border pt-1.5 text-muted-foreground/70">
              {rawStr}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function QuestionToolRender({
  toolCallId,
  args,
  result,
  status,
}: {
  toolCallId: string;
  args?: unknown;
  result?: unknown;
  status?: { type: string; reason?: string };
}) {
  const pendingQuestions = useOpenCodeQuestions();
  const isPending = pendingQuestions.some(
    (q) => q.tool?.callID === toolCallId,
  );

  if (isPending || status?.type === "running") return null;

  const questionArgs = args as QuestionArgs;
  const questions = questionArgs?.questions ?? [];

  if (status?.type === "incomplete") {
    return (
      <div className="flex items-center gap-1.5 py-0.5 text-sm text-muted-foreground">
        <MessageSquareIcon className="size-3.5 shrink-0" />
        <span className="font-mono text-xs">
          <span className="text-muted-foreground">question</span>
          <span className="text-muted-foreground/60 ml-1.5 line-through">
            cancelled
          </span>
        </span>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const answers = tryParseAnswers(result);

  return <QASummary questions={questions} answers={answers} rawResult={result} />;
}

export const QuestionToolUI = makeAssistantToolUI({
  toolName: "question",
  render: QuestionToolRender,
});

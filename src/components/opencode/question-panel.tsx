import { useOpenCodeClient } from "@/components/opencode/client-context";
import { useOpenCodeQuestions } from "@assistant-ui/react-opencode";
import { Check, ChevronLeft, Send, X } from "lucide-react";
import { useState } from "react";

type QuestionInfo = {
  question: string;
  header: string;
  options: Array<{ label: string; description: string }>;
  multiple?: boolean;
  custom?: boolean;
};

type QuestionRequest = {
  id: string;
  questions: QuestionInfo[];
};

function StepQuestion({
  question,
  selected,
  customText,
  onSelect,
  onCustomChange,
}: {
  question: QuestionInfo;
  selected: string[];
  customText: string;
  onSelect: (label: string) => void;
  onCustomChange: (text: string) => void;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-muted-foreground">
        {question.header}
      </div>
      <div className="mb-3 text-sm text-foreground">{question.question}</div>
      <div className="flex flex-col gap-1.5">
        {question.options.map((opt) => {
          const isSelected = selected.includes(opt.label);
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onSelect(opt.label)}
              className={`flex items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-accent"
              }`}
            >
              <span
                className={`mt-0.5 flex size-4 shrink-0 items-center justify-center border ${
                  question.multiple ? "rounded-sm" : "rounded-full"
                } ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30"
                }`}
              >
                {isSelected && <Check className="size-3" />}
              </span>
              <span className="flex-1">
                <span className="font-medium">{opt.label}</span>
                {opt.description && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {opt.description}
                  </span>
                )}
              </span>
            </button>
          );
        })}
        {question.custom && (
          <input
            type="text"
            value={customText}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder="Type a custom answer…"
            className="mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        )}
      </div>
    </div>
  );
}

function QuestionPanelContent({
  questionRequest,
  client,
}: {
  questionRequest: QuestionRequest;
  client: ReturnType<typeof useOpenCodeClient>;
}) {
  const questions = questionRequest.questions;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[][]>([]);
  const [customTexts, setCustomTexts] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const currentQuestion = questions[step];
  const currentSelected = answers[step] ?? [];
  const currentCustom = customTexts[step] ?? "";
  const isLastStep = step === questions.length - 1;
  const isFirstStep = step === 0;

  const canAdvance = () => {
    const sel = currentSelected;
    const custom = currentCustom.trim();
    return sel.length > 0 || (custom && custom.length > 0);
  };

  const handleSelect = (label: string) => {
    setAnswers((prev) => {
      const current = prev[step] ?? [];
      if (currentQuestion.multiple) {
        const next = [...prev];
        next[step] = current.includes(label)
          ? current.filter((s) => s !== label)
          : [...current, label];
        return next;
      }
      const next = [...prev];
      next[step] = [label];
      return next;
    });
  };

  const handleCustomChange = (text: string) => {
    setCustomTexts((prev) => {
      const next = [...prev];
      next[step] = text;
      return next;
    });
  };

  const handleNext = async () => {
    if (!canAdvance()) return;
    if (isLastStep) {
      setSubmitting(true);
      const allAnswers = questions.map((_, qIdx) => {
        const sel = answers[qIdx] ?? [];
        const custom = (customTexts[qIdx] ?? "").trim();
        return custom ? [...sel, custom] : sel;
      });
      try {
        await client.question.reply({
          requestID: questionRequest.id,
          answers: allAnswers,
        });
      } finally {
        setSubmitting(false);
      }
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);
    try {
      await client.question.reject({
        requestID: questionRequest.id,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-b">
      <div
        className="mx-auto w-full max-w-(--thread-max-width) px-4 py-3"
        style={{ ["--thread-max-width" as string]: "44rem" }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {questions.length > 1
              ? `Question ${step + 1}/${questions.length}`
              : "Question"}
          </span>
          <button
            type="button"
            onClick={handleReject}
            disabled={submitting}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <StepQuestion
          question={currentQuestion}
          selected={currentSelected}
          customText={currentCustom}
          onSelect={handleSelect}
          onCustomChange={handleCustomChange}
        />

        <div className="mt-3 flex items-center gap-2">
          {!isFirstStep && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={submitting}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent"
            >
              <ChevronLeft className="size-3.5" />
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canAdvance() || submitting}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLastStep ? (
              <>
                <Send className="size-3.5" />
                {submitting ? "Submitting…" : "Submit"}
              </>
            ) : (
              "Next"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function QuestionPanel() {
  const pendingQuestions = useOpenCodeQuestions();
  const client = useOpenCodeClient();

  if (pendingQuestions.length === 0) return null;

  const questionRequest = pendingQuestions[0] as unknown as QuestionRequest;

  return (
    <QuestionPanelContent
      key={questionRequest.id}
      questionRequest={questionRequest}
      client={client}
    />
  );
}

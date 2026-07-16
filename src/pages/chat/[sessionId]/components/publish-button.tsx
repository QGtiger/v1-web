import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import confetti from "canvas-confetti";
import {
  RocketIcon,
  CheckIcon,
  LoaderIcon,
  XIcon,
  ExternalLinkIcon,
  CopyIcon,
  CircleAlertIcon,
} from "lucide-react";
import { SERVER_BASE_URL } from "@/pages/constant";
import { useWorkspaceModel } from "../model";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Phase = "build" | "upload" | "notify";
type PublishStatus = "idle" | "publishing" | "success" | "error";

type LogLine = {
  text: string;
  stream?: "stdout" | "stderr";
  ts: number;
};

type PublishResult = {
  version: string;
  appName: string;
  ossIndexUrl: string;
  domain: string;
};

type PublishError = { message: string; phase?: Phase | string };

type PublishState = {
  status: PublishStatus;
  phase: Phase;
  logs: LogLine[];
  result?: PublishResult;
  error?: PublishError;
};

const PHASE_ORDER: Phase[] = ["build", "upload", "notify"];

const PHASE_LABEL: Record<Phase, string> = {
  build: "构建",
  upload: "上传 OSS",
  notify: "通知部署",
};

function inferPhase(text: string, current: Phase): Phase {
  if (text.includes("[publish] 开始上传 OSS")) return "upload";
  if (text.includes("[publish] 开始通知")) return "notify";
  if (text.includes("[publish] 开始构建")) return "build";
  return current;
}

type SseFrame = { event: string; data: unknown };

function parseSseFrame(raw: string): SseFrame | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:"))
      dataLines.push(line.slice(5).replace(/^ /, ""));
  }
  const dataStr = dataLines.join("\n");
  let data: unknown = {};
  if (dataStr) {
    try {
      data = JSON.parse(dataStr);
    } catch {
      // 非 JSON 载荷，忽略
    }
  }
  return { event, data };
}

function fireConfetti() {
  let petal: confetti.Shape | undefined;
  try {
    petal = confetti.shapeFromText({ text: "🌸" });
  } catch {
    // 老环境不支持 shapeFromText，退回默认形状
  }
  const end = Date.now() + 3000;
  const tick = () => {
    confetti({
      particleCount: 3,
      startVelocity: 0,
      gravity: 0.6,
      spread: 360,
      ticks: 300,
      origin: { x: Math.random(), y: -0.1 },
      shapes: petal ? [petal] : undefined,
      scalar: 1.4,
      colors: ["#ffb7c5", "#ff8fab", "#ffd6e0", "#ffffff"],
    });
    if (Date.now() < end) requestAnimationFrame(tick);
  };
  tick();
  confetti({
    particleCount: 120,
    spread: 90,
    origin: { y: 0.6 },
    shapes: petal ? [petal] : undefined,
    colors: ["#ffb7c5", "#ff8fab", "#ffd6e0", "#ffffff"],
  });
}

function usePublish() {
  const [state, setState] = useState<PublishState>({
    status: "idle",
    phase: "build",
    logs: [],
  });
  const ctrlRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    ctrlRef.current?.abort();
    ctrlRef.current = null;
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState({ status: "idle", phase: "build", logs: [] });
  }, [cancel]);

  const publish = useCallback(async (sessionId: string) => {
    // 中断上一次（若有）
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    setState({ status: "publishing", phase: "build", logs: [] });

    let phase: Phase = "build";
    let res: Response;
    try {
      res = await fetch(
        `${SERVER_BASE_URL}/api/workspaces/${sessionId}/publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
          signal: ctrl.signal,
        },
      );
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setState((s) => ({
        ...s,
        status: "error",
        error: { message: e instanceof Error ? e.message : String(e) },
      }));
      return;
    }

    if (!res.ok || !res.body) {
      let message = `发布请求失败 (HTTP ${res.status})`;
      try {
        const j = (await res.json()) as { error?: string };
        if (j?.error) message = j.error;
      } catch {
        // 忽略
      }
      setState((s) => ({ ...s, status: "error", error: { message } }));
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const raw = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const frame = parseSseFrame(raw);
          if (!frame) continue;

          if (frame.event === "publish.log") {
            const { stream, text } = frame.data as {
              stream?: "stdout" | "stderr";
              text: string;
            };
            phase = inferPhase(text, phase);
            setState((s) => ({
              ...s,
              phase,
              logs: [...s.logs, { text, stream, ts: Date.now() }],
            }));
          } else if (frame.event === "publish.done") {
            const result = frame.data as PublishResult;
            setState((s) => ({
              ...s,
              status: "success",
              phase: "notify",
              result,
            }));
            fireConfetti();
            return;
          } else if (frame.event === "error") {
            const err = frame.data as PublishError;
            setState((s) => ({
              ...s,
              status: "error",
              error: { message: err.message, phase: err.phase ?? phase },
            }));
            return;
          }
        }
      }
      // 流自然结束但没收到 done/error：视为未知错误
      setState((s) =>
        s.status === "success"
          ? s
          : {
              ...s,
              status: "error",
              error: { message: "发布连接意外断开", phase },
            },
      );
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setState((s) => ({
        ...s,
        status: "error",
        error: { message: e instanceof Error ? e.message : String(e), phase },
      }));
    }
  }, []);

  // 卸载时中断
  useEffect(() => () => ctrlRef.current?.abort(), []);

  return { state, publish, cancel, reset };
}

type StepStatus = "pending" | "active" | "done" | "error";

function PublishStepper({
  status,
  phase,
  errorPhase,
}: {
  status: PublishStatus;
  phase: Phase;
  errorPhase?: string;
}) {
  const steps: Array<{ key: Phase | "done"; label: string }> = [
    { key: "build", label: "构建" },
    { key: "upload", label: "上传 OSS" },
    { key: "notify", label: "通知部署" },
    { key: "done", label: "完成" },
  ];

  const currentIdx = PHASE_ORDER.indexOf(phase);
  const errorIdx =
    errorPhase && (PHASE_ORDER as readonly string[]).includes(errorPhase)
      ? (PHASE_ORDER as readonly string[]).indexOf(errorPhase)
      : -1;

  const stepStatus = (idx: number): StepStatus => {
    if (status === "success") return "done";
    if (status === "error" && idx === errorIdx) return "error";
    if (status === "publishing") {
      if (idx < currentIdx) return "done";
      if (idx === currentIdx) return "active";
      return "pending";
    }
    return "pending";
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {steps.map((step, i) => {
        const s = stepStatus(i);
        return (
          <div key={step.key} className="flex items-center gap-1.5">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                s === "done" && "text-emerald-600 dark:text-emerald-400",
                s === "active" && "bg-accent text-foreground",
                s === "error" && "text-destructive",
                s === "pending" && "text-muted-foreground",
              )}
            >
              <span className="flex size-4 items-center justify-center">
                {s === "done" ? (
                  <CheckIcon className="size-3.5" />
                ) : s === "active" ? (
                  <LoaderIcon className="size-3.5 animate-spin [animation-duration:0.8s]" />
                ) : s === "error" ? (
                  <XIcon className="size-3.5" />
                ) : (
                  <span className="size-1.5 rounded-full bg-current opacity-40" />
                )}
              </span>
              {step.label}
            </div>
            {i < steps.length - 1 && (
              <span className="h-px w-3 shrink-0 bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function LogViewer({ logs }: { logs: LogLine[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="rounded-md border border-border bg-muted/30 px-3 py-6 text-center text-xs text-muted-foreground">
        等待发布日志…
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="h-40 overflow-y-auto rounded-md border border-border bg-zinc-950 p-2.5 font-mono text-xs leading-relaxed text-zinc-300"
    >
      {logs.map((log, i) => (
        <div
          key={i}
          className={cn(
            "whitespace-pre-wrap break-all",
            log.stream === "stderr" && "text-red-400",
          )}
        >
          {log.text}
        </div>
      ))}
    </div>
  );
}

export function PublishButton() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { state } = useWorkspaceModel();
  const { state: pub, publish, reset } = usePublish();
  const [copied, setCopied] = useState(false);

  const ready = state.status === "ready";
  const open = pub.status !== "idle";

  const handleClick = () => {
    if (!sessionId || pub.status === "publishing") return;
    setCopied(false);
    void publish(sessionId);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) reset();
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 忽略
    }
  };

  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={handleClick}
        disabled={!ready || pub.status === "publishing"}
        title={!ready ? "请等待预览就绪" : undefined}
        className="ml-auto gap-1.5"
      >
        {pub.status === "publishing" ? (
          <LoaderIcon className="size-3.5 animate-spin [animation-duration:0.8s]" />
        ) : (
          <RocketIcon className="size-3.5" />
        )}
        {pub.status === "publishing" ? "发布中" : "发布"}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton className="sm:max-w-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {pub.status === "success"
                ? "发布成功"
                : pub.status === "error"
                  ? "发布失败"
                  : "正在发布"}
            </DialogTitle>
            <DialogDescription>
              {pub.status === "success"
                ? "你的应用已上线，可点击下方链接访问。"
                : pub.status === "error"
                  ? "发布过程中出错，请查看下方日志与错误信息。"
                  : "正在构建并上传产物，请勿关闭窗口。"}
            </DialogDescription>
          </DialogHeader>

          <div className="min-w-0 space-y-3 overflow-hidden">
            <PublishStepper
              status={pub.status}
              phase={pub.phase}
              errorPhase={pub.error?.phase}
            />

            <LogViewer logs={pub.logs} />

            {pub.status === "error" && pub.error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium">
                    {pub.error.phase
                      ? `${PHASE_LABEL[pub.error.phase as Phase] ?? pub.error.phase} 阶段失败`
                      : "发布失败"}
                  </div>
                  <div className="mt-0.5 break-words text-xs opacity-90">
                    {pub.error.message}
                  </div>
                </div>
              </div>
            )}

            {pub.status === "success" && pub.result && (
              <div className="space-y-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 text-sm">
                <div className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckIcon className="size-4" />
                  已部署到线上
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-xs text-muted-foreground">
                      站点
                    </span>
                    <a
                      href={pub.result.domain}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-w-0 flex-1 items-center gap-1 truncate text-primary hover:underline"
                    >
                      <span className="truncate">{pub.result.domain}</span>
                      <ExternalLinkIcon className="size-3.5 shrink-0" />
                    </a>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleCopy(pub.result!.domain)}
                    >
                      <CopyIcon className="size-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-xs text-muted-foreground">
                      版本
                    </span>
                    <span className="truncate font-mono text-xs">
                      {pub.result.version}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-xs text-muted-foreground">
                      OSS
                    </span>
                    <a
                      href={pub.result.ossIndexUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-w-0 flex-1 items-center gap-1 truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      <span className="truncate">{pub.result.ossIndexUrl}</span>
                      <ExternalLinkIcon className="size-3 shrink-0" />
                    </a>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleCopy(pub.result!.ossIndexUrl)}
                    >
                      <CopyIcon className="size-3.5" />
                    </Button>
                  </div>
                </div>
                {copied && (
                  <div className="text-xs text-muted-foreground">已复制</div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            {pub.status === "publishing" ? (
              <Button variant="outline" onClick={() => reset()}>
                取消并关闭
              </Button>
            ) : (
              <Button variant="outline" onClick={() => reset()}>
                关闭
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

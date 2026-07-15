import { useState } from "react";
import {
  RefreshCwIcon,
  ExternalLinkIcon,
  LoaderIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { useWorkspaceModel } from "../model";

function SkeletonLoading({ text }: { text: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border px-3">
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        <div className="ml-auto h-3 w-6 animate-pulse rounded bg-muted" />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex gap-4">
          <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <div className="h-4 animate-pulse rounded bg-muted" style={{ width: "80%" }} />
          <div className="h-4 animate-pulse rounded bg-muted" style={{ width: "60%" }} />
          <div className="h-4 animate-pulse rounded bg-muted" style={{ width: "70%" }} />
          <div className="h-4 animate-pulse rounded bg-muted" style={{ width: "45%" }} />
        </div>
        <div className="mt-2 flex gap-3">
          <div className="h-20 flex-1 animate-pulse rounded-lg bg-muted" />
          <div className="h-20 flex-1 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="mt-2 h-4 animate-pulse rounded bg-muted" style={{ width: "55%" }} />
        <div className="h-4 animate-pulse rounded bg-muted" style={{ width: "65%" }} />
      </div>
      <div className="flex items-center justify-center gap-2 pb-6 text-xs text-muted-foreground">
        <LoaderIcon className="size-3 animate-spin [animation-duration:0.8s]" />
        {text}
      </div>
    </div>
  );
}

export function PreviewTab() {
  const { state, retry } = useWorkspaceModel();
  const [iframeKey, setIframeKey] = useState(0);

  if (state.status === "ready" && state.previewUrl) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-3">
          <div className="flex items-center gap-1.5 text-xs">
            <CheckCircle2Icon className="size-3 text-green-500" />
            <span className="text-green-500">Ready</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIframeKey((k) => k + 1)}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Refresh preview"
            >
              <RefreshCwIcon className="size-3.5" />
            </button>
            <a
              href={state.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Open in new tab"
            >
              <ExternalLinkIcon className="size-3.5" />
            </a>
          </div>
        </div>
        <iframe
          key={iframeKey}
          src={state.previewUrl}
          className="flex-1 border-0 bg-white"
          title="Preview"
        />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
        <AlertCircleIcon className="size-8 text-red-500" />
        <div className="text-center">
          <div className="text-sm font-medium text-foreground">
            {state.message}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Phase: {state.phase}
          </div>
        </div>
        <button
          onClick={retry}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RefreshCwIcon className="size-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const loadingText =
    state.status === "connecting"
      ? "Connecting to server..."
      : state.status === "installing"
        ? "Installing dependencies..."
        : state.status === "serving"
          ? "Starting dev server..."
          : "Loading...";

  return <SkeletonLoading text={loadingText} />;
}

import { createCustomModel } from "@lightfish/react-model";
import { useEffect, useRef, useState } from "react";
import { SERVER_BASE_URL } from "@/pages/constant";

export type LogLine = {
  text: string;
  stream?: "stdout" | "stderr";
  timestamp: number;
};

export type WorkspaceState =
  | { status: "idle" }
  | { status: "connecting" }
  | { status: "installing"; logs: LogLine[] }
  | { status: "serving"; logs: LogLine[] }
  | { status: "ready"; previewUrl: string; logs: LogLine[] }
  | {
      status: "error";
      message: string;
      phase: string;
      logs: LogLine[];
    };

function useWorkspace(sessionId: string) {
  const [state, setState] = useState<WorkspaceState>({ status: "idle" });
  const logsRef = useRef<LogLine[]>([]);

  const connect = (sid: string) => {
    setState({ status: "connecting" });
    logsRef.current = [];

    const es = new EventSource(
      `${SERVER_BASE_URL}/api/workspaces/${sid}/init`,
    );

    const appendLog = (text: string, stream?: "stdout" | "stderr") => {
      logsRef.current = [
        ...logsRef.current,
        { text, stream, timestamp: Date.now() },
      ];
    };

    es.addEventListener("init", (e) => {
      const data = JSON.parse((e as MessageEvent).data);
      appendLog(`Workspace: ${data.directory}`);
    });

    es.addEventListener("install.start", () => {
      appendLog("$ pnpm install");
      setState({ status: "installing", logs: [...logsRef.current] });
    });

    es.addEventListener("install.log", (e) => {
      const { stream, text } = JSON.parse((e as MessageEvent).data);
      appendLog(text, stream);
      setState({ status: "installing", logs: [...logsRef.current] });
    });

    es.addEventListener("install.done", (e) => {
      const { exitCode } = JSON.parse((e as MessageEvent).data);
      appendLog(`pnpm install exited with code ${exitCode}`);
    });

    es.addEventListener("install.skip", (e) => {
      const { reason } = JSON.parse((e as MessageEvent).data);
      appendLog(`[skip] ${reason}`);
    });

    es.addEventListener("serve.start", () => {
      appendLog("$ vite");
      setState({ status: "serving", logs: [...logsRef.current] });
    });

    es.addEventListener("serve.log", (e) => {
      const { text } = JSON.parse((e as MessageEvent).data);
      appendLog(text);
      setState({ status: "serving", logs: [...logsRef.current] });
    });

    es.addEventListener("serve.skip", (e) => {
      const { reason } = JSON.parse((e as MessageEvent).data);
      appendLog(`[skip] ${reason}`);
    });

    es.addEventListener("ready", (e) => {
      const { previewUrl } = JSON.parse((e as MessageEvent).data);
      appendLog("✓ Preview ready");
      setState({
        status: "ready",
        previewUrl,
        logs: [...logsRef.current],
      });
      es.close();
    });

    es.addEventListener("error", (e: Event) => {
      const me = e as MessageEvent;
      if (me.data) {
        try {
          const { phase, message } = JSON.parse(me.data);
          appendLog(`✗ Error: ${message}`);
          setState({
            status: "error",
            message,
            phase,
            logs: [...logsRef.current],
          });
        } catch {
          // not a business error event
        }
      }
      es.close();
    });

    es.onerror = () => {
      setState((prev) =>
        prev.status === "connecting"
          ? {
              status: "error",
              message: "Failed to connect to server",
              phase: "unknown",
              logs: [],
            }
          : prev,
      );
      es.close();
    };

    return () => es.close();
  };

  useEffect(() => {
    if (!sessionId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    const cleanup = connect(sessionId);
    return cleanup;
  }, [sessionId]);

  const retry = () => {
    if (sessionId) connect(sessionId);
  };

  return { state, retry };
}

export const {
  Provider: WorkspaceProvider,
  useModel: useWorkspaceModel,
} = createCustomModel(useWorkspace);

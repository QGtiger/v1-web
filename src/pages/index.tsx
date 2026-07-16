import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRequest } from "ahooks";
import { Menu } from "@base-ui/react/menu";
import {
  ArrowUpIcon,
  PlusIcon,
  MessageSquareIcon,
  BotIcon,
  SettingsIcon,
  MoreHorizontalIcon,
  Trash2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { opencodeClient, serverApi } from "@/models";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Session = {
  id: string;
  title: string;
  parentID?: string;
  time: {
    created: number;
    updated: number;
  };
};

type CreateWorkspaceResponse = {
  sessionId: string;
  directory: string;
  previewPort: number;
  previewUrl: string;
};

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function SessionSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: sessions = [], loading, refresh } = useRequest(
    async () => {
      const res = await opencodeClient.session.list();
      return ((res.data as Session[]) ?? []).filter((s) => !s.parentID);
    },
    { refreshDeps: [location.key] },
  );

  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null);

  const { runAsync: deleteSession, loading: deleting } = useRequest(
    async (id: string) => {
      try {
        await serverApi.delete(`/api/workspaces/${id}`);
      } catch (e: unknown) {
        const status = (e as { response?: { status?: number } })?.response
          ?.status;
        // 无 workspace 映射时兜底直接删 opencode session
        if (status === 404) {
          await opencodeClient.session.delete({ sessionID: id });
        } else {
          throw e;
        }
      }
    },
    { manual: true },
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    try {
      await deleteSession(deleteTarget.id);
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-border bg-muted/30">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
        <BotIcon className="size-5 text-primary" />
        <span className="text-sm font-semibold text-foreground">AI Web</span>
      </div>

      <div className="p-3">
        <button
          onClick={() => navigate("/")}
          className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <PlusIcon className="size-4" />
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="space-y-1.5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-lg bg-muted/50"
              />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-2 py-4 text-center text-xs text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-0.5">
            {sessions.map((session) => (
              <div
                key={session.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/chat/${session.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/chat/${session.id}`);
                  }
                }}
                className="group relative flex w-full cursor-pointer items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <MessageSquareIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1 pr-6">
                  <div className="truncate text-foreground/80">
                    {session.title || "New session"}
                  </div>
                  <div className="text-xs text-muted-foreground/60">
                    {formatRelativeTime(session.time.updated)}
                  </div>
                </div>

                <Menu.Root>
                  <Menu.Trigger
                    render={<button type="button" aria-label="会话操作" />}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-1 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none data-[popup-open]:opacity-100"
                  >
                    <MoreHorizontalIcon className="size-4" />
                  </Menu.Trigger>
                  <Menu.Portal>
                    <Menu.Positioner align="end" sideOffset={4}>
                      <Menu.Popup className="z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
                        <Menu.Item
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(session);
                          }}
                          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 data-highlighted:bg-destructive/10"
                        >
                          <Trash2Icon className="size-3.5" />
                          删除
                        </Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <SettingsIcon className="size-4" />
          Settings
        </button>
      </div>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>删除会话</DialogTitle>
            <DialogDescription>
              确定删除「{deleteTarget?.title || "New session"}」吗？此操作不可撤销，将同时删除工作区文件和预览服务。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? "删除中…" : "删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

export default function HomePage() {
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  const { runAsync: createWorkspace, loading } = useRequest(
    async (message: string) => {
      const res = await serverApi.post<CreateWorkspaceResponse>(
        "/api/workspaces",
        { message },
      );
      return res.data;
    },
    { manual: true },
  );

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || loading) return;
    try {
      const data = await createWorkspace(text);
      if (!data?.sessionId) throw new Error("Failed to create session");
      navigate(`/chat/${data.sessionId}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <SessionSidebar />

      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-[44rem] mx-auto px-4 flex flex-col items-center gap-8">
          <h1 className="text-2xl font-semibold text-foreground">
            How can I help you today?
          </h1>

          <div className="w-full relative flex flex-col">
            <div
              className={cn(
                "border-border/60 flex w-full flex-col gap-2 rounded-[1.5rem] border bg-[color-mix(in_oklab,var(--color-muted)_30%,var(--color-background))] p-2 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow]",
                "focus-within:border-border focus-within:shadow-[0_6px_24px_-8px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.05)]",
              )}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Send a message..."
                className="placeholder:text-muted-foreground/80 max-h-32 min-h-10 w-full resize-none bg-transparent px-2.5 py-1 text-base outline-none text-foreground"
                rows={1}
                autoFocus
              />
              <div className="flex items-center justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || loading}
                  className="size-7 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center disabled:opacity-50 transition-opacity"
                >
                  <ArrowUpIcon className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

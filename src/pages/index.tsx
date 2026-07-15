import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowUpIcon, PlusIcon, MessageSquareIcon, BotIcon, SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { opencodeClient } from "./models";

type Session = {
  id: string;
  title: string;
  time: {
    created: number;
    updated: number;
  };
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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    opencodeClient.session
      .list()
      .then((res) => {
        if (cancelled) return;
        setSessions((res.data as Session[]) ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [location.key]);

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
              <button
                key={session.id}
                onClick={() => navigate(`/chat/${session.id}`)}
                className="group flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent"
              >
                <MessageSquareIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-foreground/80">
                    {session.title || "New session"}
                  </div>
                  <div className="text-xs text-muted-foreground/60">
                    {formatRelativeTime(session.time.updated)}
                  </div>
                </div>
              </button>
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
    </aside>
  );
}

export default function HomePage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setLoading(true);
    try {
      const res = await opencodeClient.session.create({});
      if (!res.data?.id) throw new Error("Failed to create session");
      navigate(`/chat/${res.data.id}`, { state: { initialMessage: text } });
    } catch (err) {
      console.error(err);
      setLoading(false);
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

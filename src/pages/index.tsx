import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOpencodeClient } from "@opencode-ai/sdk/v2/client";
import { ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const OPENCODE_BASE_URL = "http://localhost:55033";

export default function HomePage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setLoading(true);
    try {
      const client = createOpencodeClient({ baseUrl: OPENCODE_BASE_URL });
      const res = await client.session.create({});
      if (!res.data?.id) throw new Error("Failed to create session");
      navigate(`/chat/${res.data.id}`, { state: { initialMessage: text } });
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
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
  );
}

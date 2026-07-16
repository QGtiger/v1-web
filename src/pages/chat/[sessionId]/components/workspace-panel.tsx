import { useState } from "react";
import { MonitorIcon, CodeIcon, EyeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PreviewTab } from "./preview-tab";
import { CodeTab } from "./code-tab";
import { PlaceholderTab } from "./placeholder-tab";
import { PublishButton } from "./publish-button";

type TabId = "preview" | "code" | "monitor";

const tabs: Array<{
  id: TabId;
  label: string;
  icon: typeof EyeIcon;
}> = [
  { id: "preview", label: "Preview", icon: EyeIcon },
  { id: "code", label: "Code", icon: CodeIcon },
  { id: "monitor", label: "Monitor", icon: MonitorIcon },
];

export function WorkspacePanel() {
  const [activeTab, setActiveTab] = useState<TabId>("preview");

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-border px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          );
        })}
        <PublishButton />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className={cn("h-full", activeTab === "preview" ? "block" : "hidden")}>
          <PreviewTab />
        </div>
        <div className={cn("h-full", activeTab === "code" ? "block" : "hidden")}>
          <CodeTab />
        </div>
        <div className={cn("h-full", activeTab === "monitor" ? "block" : "hidden")}>
          <PlaceholderTab
            icon={MonitorIcon}
            title="App Monitor"
            description="Monitor app performance and logs"
          />
        </div>
      </div>
    </div>
  );
}

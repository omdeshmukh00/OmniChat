"use client";

import { PanelLeft, SquarePen, Sun, Moon, Sparkles } from "lucide-react";
import { ModelSelector } from "./ModelSelector";

interface ChatHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  selectedModelId?: string;
  onSelectModel?: (modelId: string) => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

export function ChatHeader({
  sidebarOpen,
  onToggleSidebar,
  onNewChat,
  selectedModelId,
  onSelectModel,
  theme = "dark",
  onToggleTheme,
}: ChatHeaderProps) {
  return (
    <header className="h-14 border-b border-borderSubtle bg-chatbg px-3.5 flex items-center justify-between shrink-0 select-none z-10 transition-colors">
      <div className="flex items-center gap-2">
        {!sidebarOpen && (
          <div className="flex items-center gap-2 animate-fade-in">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-textMuted hover:text-textPrimary hover:bg-surfaceHover transition-colors cursor-pointer"
              title="Open sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </button>

            {/* OmniChat Logo displayed on navbar when sidebar is collapsed */}
            <div className="flex items-center gap-2 select-none pr-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800/70 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-semibold text-base text-textPrimary tracking-tight">
                OmniChat
              </span>
            </div>

            <div className="h-4 w-px bg-borderSubtle mx-1 hidden sm:block" />
          </div>
        )}

        <ModelSelector
          selectedModelId={selectedModelId}
          onSelectModel={onSelectModel}
        />
      </div>

      <div className="flex items-center gap-1.5">
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-textMuted hover:text-textPrimary hover:bg-surfaceHover transition-colors cursor-pointer"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-500" />
            )}
          </button>
        )}
        <button
          onClick={onNewChat}
          className="p-2 rounded-lg text-textMuted hover:text-textPrimary hover:bg-surfaceHover transition-colors cursor-pointer"
          title="New chat"
        >
          <SquarePen className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

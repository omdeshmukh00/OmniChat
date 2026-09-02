"use client";

import { Sparkles, Image as ImageIcon, Globe, FileText } from "lucide-react";

interface EmptyStateProps {
  onSelectAction?: (action: string) => void;
}

export function EmptyState({ onSelectAction }: EmptyStateProps) {
  const quickActions = [
    {
      id: "create_image",
      title: "Create image",
      subtitle: "Generate artwork & visuals",
      icon: ImageIcon,
      iconColor: "text-amber-500",
    },
    {
      id: "web_search",
      title: "Web search",
      subtitle: "Find live web information",
      icon: Globe,
      iconColor: "text-blue-500",
    },
    {
      id: "analyze_doc",
      title: "Analyze PDF / doc",
      subtitle: "Summarize & query files",
      icon: FileText,
      iconColor: "text-emerald-500",
    },
    {
      id: "general_chat",
      title: "Ask anything",
      subtitle: "Multimodal conversation",
      icon: Sparkles,
      iconColor: "text-purple-500",
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto select-none animate-fade-in">
      {/* OmniChat Logo Badge */}
      <div className="w-12 h-12 rounded-2xl bg-surface border border-borderSubtle flex items-center justify-center mb-5 shadow-sm">
        <Sparkles className="w-6 h-6 text-emerald-500" />
      </div>

      <h1 className="text-3xl sm:text-4xl font-semibold text-textPrimary tracking-tight mb-3">
        What can I help with today?
      </h1>
      <p className="text-sm sm:text-base text-textMuted max-w-md mb-8 leading-relaxed">
        Ask a question, upload a document or image, search the web, or switch AI models anytime.
      </p>

      {/* Suggested Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onSelectAction?.(action.id)}
              className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-cardBg hover:bg-cardHoverBg border border-cardBorder hover:border-cardHoverBorder text-left transition-all group shadow-sm cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-surface group-hover:bg-surfaceHover transition-colors shrink-0 mt-0.5 border border-borderSubtle">
                <Icon className={`w-4.5 h-4.5 ${action.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-textPrimary transition-colors">
                  {action.title}
                </div>
                <div className="text-xs text-textMuted mt-0.5 truncate">
                  {action.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

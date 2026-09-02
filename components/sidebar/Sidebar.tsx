"use client";

import { useState, useEffect } from "react";
import {
  PanelLeftClose,
  SquarePen,
  Search,
  MessageSquare,
  User,
  Sparkles,
  ChevronRight,
  Trash2,
  Moon,
  Sun,
  X,
} from "lucide-react";

export interface ConversationSummary {
  id: string;
  title: string;
  dateGroup: "Today" | "Yesterday" | "Previous 7 Days" | "Older";
  updatedAt: string;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations?: ConversationSummary[];
  activeConversationId?: string;
  onSelectConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onNewChat?: () => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

export function Sidebar({
  isOpen,
  onToggle,
  conversations: externalConversations,
  activeConversationId = "",
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
  theme = "dark",
  onToggleTheme,
}: SidebarProps) {
  const [internalConversations, setInternalConversations] = useState<ConversationSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const activeConversations = externalConversations && externalConversations.length > 0
    ? externalConversations
    : internalConversations;

  // Close sidebar on escape key on small screens
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onToggle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onToggle]);

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onDeleteConversation) {
      onDeleteConversation(id);
    }
    setInternalConversations((prev) => prev.filter((c) => c.id !== id));
  };

  const filteredConversations = activeConversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop with smooth fade transition */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onToggle}
        aria-hidden="true"
      />

      {/* Smoothly Collapsing Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col h-screen shrink-0 select-none bg-sidebar border-r border-borderSubtle transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen
            ? "w-[280px] md:w-72 translate-x-0 opacity-100"
            : "w-0 -translate-x-full md:translate-x-0 md:w-0 opacity-0 pointer-events-none border-r-transparent"
        }`}
      >
        {/* Inner Content Wrapper keeping consistent width during width collapse */}
        <div className="w-[280px] md:w-72 flex flex-col h-full shrink-0">
          {/* Sidebar Header */}
          <div className="h-14 px-3.5 flex items-center justify-between border-b border-borderSubtle shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800/70 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <span className="font-semibold text-base text-textPrimary tracking-tight">
                OmniChat
              </span>
            </div>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg text-textMuted hover:text-textPrimary hover:bg-surfaceHover transition-colors cursor-pointer"
              title="Close sidebar"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          {/* Main Actions */}
          <div className="p-3 space-y-2 border-b border-borderSubtle">
            <button
              onClick={() => {
                onNewChat?.();
                if (typeof window !== "undefined" && window.innerWidth < 768) {
                  onToggle();
                }
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface hover:bg-surfaceHover text-[15px] text-textPrimary font-medium transition-all border border-borderSubtle group cursor-pointer shadow-xs"
            >
              <span className="flex items-center gap-2.5">
                <SquarePen className="w-4.5 h-4.5 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span>New chat</span>
              </span>
            </button>

            {/* Search Toggle / Input */}
            {isSearching ? (
              <div className="relative pt-0.5">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  autoFocus
                  className="w-full bg-surface border border-borderSubtle rounded-lg px-3 py-1.5 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => {
                    setIsSearching(false);
                    setSearchQuery("");
                  }}
                  className="absolute right-2.5 top-2.5 text-textMuted hover:text-textPrimary cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <nav className="space-y-0.5">
                <button
                  onClick={() => setIsSearching(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surfaceHover transition-colors text-textMuted hover:text-textPrimary text-sm font-medium cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Search chats</span>
                </button>
              </nav>
            )}
          </div>

          {/* Recents Section */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            <div>
              <div className="px-2 mb-2 text-xs font-semibold text-textMuted uppercase tracking-wider">
                Recent chats
              </div>
              {filteredConversations.length === 0 ? (
                <div className="px-2 py-3 text-sm text-textMuted italic">
                  No recent chats
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConversations.map((chat) => {
                    const isActive = chat.id === activeConversationId;
                    return (
                      <div
                        key={chat.id}
                        onClick={() => {
                          onSelectConversation?.(chat.id);
                          if (typeof window !== "undefined" && window.innerWidth < 768) {
                            onToggle();
                          }
                        }}
                        className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl text-[13.5px] transition-colors cursor-pointer group ${
                          isActive
                            ? "bg-surfaceHover text-textPrimary font-medium"
                            : "text-textSecondary hover:text-textPrimary hover:bg-surface"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
                          <MessageSquare className="w-4 h-4 text-textMuted shrink-0 group-hover:text-emerald-500 transition-colors" />
                          <span className="truncate">{chat.title}</span>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleDeleteConversation(e, chat.id)}
                            className="p-1 rounded hover:bg-surfaceHover text-textMuted hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete chat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Profile Footer */}
          <div className="p-3 border-t border-borderSubtle relative">
            {userMenuOpen && (
              <div className="absolute bottom-full left-3 right-3 mb-2 bg-dropdownBg border border-borderSubtle rounded-xl shadow-2xl p-1.5 z-30 animate-fade-in">
                <button
                  onClick={() => {
                    onToggleTheme?.();
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-textPrimary hover:bg-dropdownHover transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {theme === "dark" ? (
                      <Sun className="w-4.5 h-4.5 text-amber-400" />
                    ) : (
                      <Moon className="w-4.5 h-4.5 text-indigo-500" />
                    )}
                    <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
                  </span>
                </button>
              </div>
            )}

            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-surfaceHover transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-surface border border-borderSubtle flex items-center justify-center text-textPrimary font-semibold text-xs group-hover:border-emerald-500/50 transition-colors">
                  <User className="w-4.5 h-4.5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-textPrimary">
                    Academic User
                  </div>
                  <div className="text-xs text-emerald-500 font-medium">
                    OmniChat Pro
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-textMuted group-hover:text-textPrimary transition-colors" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

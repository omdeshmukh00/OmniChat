"use client";

import { useRef, useEffect } from "react";
import { Paperclip, Palette, Globe } from "lucide-react";

export interface PlusMenuOption {
  id: string;
  label: string;
  description: string;
  icon: typeof Paperclip;
}

const MENU_OPTIONS: PlusMenuOption[] = [
  {
    id: "add_files",
    label: "Add photos & files",
    description: "Import images, PDFs, DOCX, TXT, etc.",
    icon: Paperclip,
  },
  {
    id: "create_image",
    label: "Create image",
    description: "Switch to image generation mode",
    icon: Palette,
  },
  {
    id: "web_search",
    label: "Web search",
    description: "Enable web search mode",
    icon: Globe,
  },
];

interface ComposerPlusMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (optionId: string) => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}

export function ComposerPlusMenu({
  isOpen,
  onClose,
  onSelectOption,
  buttonRef,
}: ComposerPlusMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const targetNode = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(targetNode) &&
        (!buttonRef?.current || !buttonRef.current.contains(targetNode))
      ) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, buttonRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-0 mb-3 w-80 bg-dropdownBg border border-borderSubtle rounded-2xl shadow-2xl p-2 z-50 overflow-hidden animate-fade-in select-none"
    >
      <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-textMuted border-b border-borderSubtle mb-1">
        Tools & Attachment Actions
      </div>
      <div className="space-y-0.5">
        {MENU_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onSelectOption(opt.id);
                onClose();
              }}
              className="w-full text-left p-2.5 rounded-xl hover:bg-dropdownHover focus:bg-dropdownHover focus:outline-none transition-colors flex items-center gap-3 group cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-surface group-hover:bg-surfaceHover transition-colors text-emerald-500">
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-textPrimary">
                  {opt.label}
                </div>
                <div className="text-xs text-textMuted truncate">
                  {opt.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

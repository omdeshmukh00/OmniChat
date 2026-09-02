"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Sparkles, Check, Zap, Cpu, Flame } from "lucide-react";

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description: string;
}

const DEFAULT_MODELS: ModelOption[] = [
  {
    id: "auto",
    name: "Auto (Smart Router)",
    provider: "auto",
    description: "Automatically routes prompts to active high-performance model (Gemini 3.6 Flash).",
  },
  {
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    provider: "gemini",
    description: "Google's active multimodal model with high speed and zero rate limits.",
  },
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    provider: "gemini",
    description: "Google's fast multimodal model for general conversational tasks.",
  },
  {
    id: "gpt-4o",
    name: "OpenAI GPT-4o",
    provider: "openai",
    description: "Flagship OpenAI model (Requires active OpenAI API credit balance).",
  },
];

interface ModelSelectorProps {
  selectedModelId?: string;
  onSelectModel?: (modelId: string) => void;
}

export function ModelSelector({
  selectedModelId = "auto",
  onSelectModel,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModel =
    DEFAULT_MODELS.find((m) => m.id === selectedModelId) || DEFAULT_MODELS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    if (onSelectModel) {
      onSelectModel(id);
    }
    setIsOpen(false);
  };

  const getModelIcon = (provider: string) => {
    switch (provider) {
      case "auto":
        return <Zap className="w-4 h-4 text-amber-500 shrink-0" />;
      case "openai":
        return <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />;
      case "gemini":
        return <Cpu className="w-4 h-4 text-blue-500 shrink-0" />;
      case "anthropic":
        return <Flame className="w-4 h-4 text-amber-500 shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-surfaceHover transition-colors text-[15px] font-semibold text-textPrimary border border-transparent hover:border-borderSubtle cursor-pointer"
      >
        <span className="flex items-center gap-2">
          {getModelIcon(selectedModel.provider)}
          <span>{selectedModel.name}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-textMuted transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-84 rounded-2xl bg-dropdownBg border border-borderSubtle shadow-2xl z-50 p-2 overflow-hidden animate-fade-in">
          <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-textMuted border-b border-borderSubtle mb-1">
            Switch AI Provider & Model
          </div>

          <div className="space-y-1">
            {DEFAULT_MODELS.map((model) => {
              const isSelected = model.id === selectedModelId;
              return (
                <button
                  key={model.id}
                  onClick={() => handleSelect(model.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-start justify-between group cursor-pointer ${
                    isSelected
                      ? "bg-surfaceHover text-textPrimary font-medium shadow-sm"
                      : "hover:bg-dropdownHover text-textSecondary"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-[14px] flex items-center gap-2 text-textPrimary">
                      {getModelIcon(model.provider)}
                      <span>{model.name}</span>
                    </div>
                    <p className="text-xs text-textMuted leading-relaxed pl-5">
                      {model.description}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 ml-2 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

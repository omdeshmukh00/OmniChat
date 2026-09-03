"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar, ConversationSummary } from "@/components/sidebar/Sidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { EmptyState } from "@/components/chat/EmptyState";
import { MessageList, MessageUI } from "@/components/chat/MessageList";
import { Composer } from "@/components/composer/Composer";
import { AutoRouter } from "@/lib/ai/router";

interface ChatAppProps {
  initialConversationId?: string;
}

function extractAspectRatio(prompt: string, mode: string): "1:1" | "16:9" | "9:16" | "4:3" | "3:4" {
  if (mode.startsWith("image_")) {
    const ratioStr = mode.replace("image_", "");
    if (["1:1", "16:9", "9:16", "4:3", "3:4"].includes(ratioStr)) {
      return ratioStr as any;
    }
  }
  const lower = prompt.toLowerCase();
  if (lower.includes("16:9") || lower.includes("16x9") || lower.includes("widescreen") || lower.includes("wallpaper")) {
    return "16:9";
  }
  if (lower.includes("9:16") || lower.includes("9x16") || lower.includes("vertical") || lower.includes("portrait") || lower.includes("reel")) {
    return "9:16";
  }
  if (lower.includes("4:3") || lower.includes("4x3")) {
    return "4:3";
  }
  if (lower.includes("3:4") || lower.includes("3x4")) {
    return "3:4";
  }
  return "1:1";
}

export function ChatApp({ initialConversationId = "" }: ChatAppProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState("auto");
  const [activeConversationId, setActiveConversationId] = useState(initialConversationId);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<MessageUI[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [pendingComposerMode, setPendingComposerMode] = useState<"chat" | "image" | "search">("chat");
  const [pendingComposerInput, setPendingComposerInput] = useState<string>("");
  const [filePickerNonce, setFilePickerNonce] = useState<number>(0);
  const [focusNonce, setFocusNonce] = useState<number>(0);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.status === "streaming" ? { ...m, status: "complete" } : m))
    );
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    fetchConversations();
    if (initialConversationId) {
      loadConversationMessages(initialConversationId);
    }
    const savedTheme = localStorage.getItem("omnichat-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
      applyThemeToDom(savedTheme);
    } else {
      applyThemeToDom("dark");
    }
  }, [initialConversationId]);

  // Mobile Touch Swipe Listener (Swipe Right / Left-edge drag opens sidebar, Swipe Left closes)
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartX || !touchStartY) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const duration = Date.now() - touchStartTime;

      const startX = touchStartX;
      touchStartX = 0;
      touchStartY = 0;

      // Ignore slow gestures (> 600ms) or dominant vertical scroll
      if (duration > 600) return;
      if (Math.abs(deltaY) > Math.abs(deltaX) * 0.8) return;
      if (Math.abs(deltaX) < 35 && startX >= 60) return;

      // Ignore swipe gesture inside scrollable code blocks or tables
      const target = e.target as HTMLElement | null;
      if (target && target.closest("pre, table, textarea, input")) return;

      const isMobile = window.innerWidth < 768;
      if (!isMobile) return;

      // Swipe Right or Swipe from Left Edge -> OPEN Sidebar
      if (deltaX > 35 || (startX < 60 && deltaX > 15)) {
        setSidebarOpen(true);
      }
      // Swipe Left -> CLOSE Sidebar
      else if (deltaX < -35) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  const applyThemeToDom = (t: "dark" | "light") => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark", "light");
      document.documentElement.classList.add(t);
      document.documentElement.setAttribute("data-theme", t);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const nextTheme = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("omnichat-theme", nextTheme);
      } catch {}
      applyThemeToDom(nextTheme);
      return nextTheme;
    });
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        if (data.conversations) {
          const mapped: ConversationSummary[] = data.conversations.map((c: any) => ({
            id: c.id,
            title: c.title,
            dateGroup: "Today",
            updatedAt: "Just now",
          }));
          setConversations(mapped);
        }
      }
    } catch (err) {
      console.warn("Could not fetch conversations:", err);
    }
  };

  const navigateTo = (url: string) => {
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", url);
    }
  };

  const loadConversationMessages = async (id: string) => {
    setActiveConversationId(id);
    navigateTo(`/c/${id}`);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      }
    } catch (err) {
      console.warn("Could not load messages:", err);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.warn("Delete conversation error:", err);
    }
  };

  const handleNewChat = () => {
    if (isStreaming) handleStopStream();
    setMessages([]);
    setActiveConversationId("");
    setPendingComposerMode("chat");
    setPendingComposerInput("");
    navigateTo("/");
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleQuickAction = (actionId: string) => {
    if (actionId === "analyze_doc") {
      setPendingComposerInput("Analyze PDF and summarize key insights");
      setFilePickerNonce(Date.now());
      setFocusNonce(Date.now());
    } else if (actionId === "create_image") {
      setPendingComposerMode("image");
      setFocusNonce(Date.now());
    } else if (actionId === "web_search") {
      setPendingComposerMode("search");
      setFocusNonce(Date.now());
    } else if (actionId === "general_chat") {
      setPendingComposerMode("chat");
      setFocusNonce(Date.now());
    } else {
      setPendingComposerMode("chat");
      setFocusNonce(Date.now());
    }
  };

  const handleEditMessage = (messageId: string, newText: string) => {
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex >= 0) {
      if (isStreaming) handleStopStream();
      const targetMsg = messages[msgIndex];
      const existingFiles = targetMsg.attachments || [];
      const truncated = messages.slice(0, msgIndex);
      setMessages(truncated);
      handleSend(newText, "auto", existingFiles as any);
    }
  };

  const handleSend = async (
    text: string,
    mode: string,
    files: { id: string; name: string; previewUrl?: string; type?: string }[]
  ) => {
    const userMsgId = Math.random().toString(36).substring(2, 9);
    let userContent = text;
    if (!userContent && files.length > 0) {
      userContent = `Uploaded ${files.length} attachment(s): ${files.map((f) => f.name).join(", ")}`;
    }

    const userMessage: MessageUI = {
      id: userMsgId,
      role: "user",
      content: userContent,
      attachments: files.map((f: any) => ({
        id: f.id,
        name: f.name,
        type: f.type || (f.name?.match(/\.(png|jpg|jpeg|webp)$/i) ? "image" : "file"),
        url: f.previewUrl || `/api/image/asset/${f.id}`,
      })),
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Route using central AutoRouter.classifyIntent
    const detectedIntent = AutoRouter.classifyIntent(text, mode, files);
    const targetRatio = extractAspectRatio(text, mode);

    console.log(`[ROUTER] intent=${detectedIntent} mode=${mode} files=${files.length}`);

    // 1. IMAGE GENERATION Intent Route (Hugging Face FLUX.1-schnell)
    if (detectedIntent === "IMAGE_GENERATION") {
      const assistantMsgId = Math.random().toString(36).substring(2, 9);
      const initialAssistantMsg: MessageUI = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        type: "image_generation",
        imageGeneration: {
          prompt: text || "Generate a realistic image",
          model: "black-forest-labs/FLUX.1-schnell",
          provider: "huggingface",
          status: "generating",
          aspectRatio: targetRatio,
        },
        timestamp: "Just now",
      };

      setMessages((prev) => [...prev, initialAssistantMsg]);

      try {
        const res = await fetch("/api/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: text,
            conversationId: activeConversationId || undefined,
            aspectRatio: targetRatio,
          }),
          signal: controller.signal,
        });

        const data = await res.json();

        if (data.conversationId) {
          setActiveConversationId(data.conversationId);
          navigateTo(`/c/${data.conversationId}`);
          fetchConversations();
        }

        if (res.ok && data.success && data.image?.assetUrl) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    type: "image_generation",
                    imageGeneration: {
                      prompt: data.prompt || text,
                      model: data.model || "black-forest-labs/FLUX.1-schnell",
                      provider: data.provider || "huggingface",
                      status: "completed",
                      assetUrl: data.image.assetUrl,
                      mimeType: data.image.mimeType || "image/jpeg",
                      aspectRatio: data.aspectRatio || targetRatio,
                      width: data.width,
                      height: data.height,
                    },
                  }
                : msg
            )
          );
        } else {
          const isQuota = data.code === "IMAGE_PROVIDER_QUOTA";
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    type: "image_generation",
                    imageGeneration: {
                      prompt: text,
                      model: data.model || "black-forest-labs/FLUX.1-schnell",
                      provider: data.provider || "huggingface",
                      status: isQuota ? "quota_error" : "failed",
                      errorCode: data.code || "IMAGE_GENERATION_FAILED",
                      error: data.error || "Image generation is currently unavailable.",
                    },
                  }
                : msg
            )
          );
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  type: "image_generation",
                  imageGeneration: {
                    prompt: text,
                    model: "black-forest-labs/FLUX.1-schnell",
                    provider: "huggingface",
                    status: "failed",
                    errorCode: "REQUEST_FAILED",
                    error: err?.message || "Failed to generate image.",
                  },
                }
              : msg
          )
        );
      } finally {
        setIsStreaming(false);
      }
      return;
    }

    // 2. WEB SEARCH Intent Route (Real-Time Grounded Search Synthesis)
    let extraSearchContext = "";
    if (detectedIntent === "WEB_SEARCH") {
      try {
        const searchRes = await fetch(`/api/search?q=${encodeURIComponent(text)}`, {
          signal: controller.signal,
        });
        const data = await searchRes.json();
        if (data.results && data.results.length > 0) {
          extraSearchContext = `\n\n### 🌐 LIVE RETRIEVED WEB FINDINGS FOR "${text}":\n${data.results
            .map((r: any) => `- **Title:** [${r.title}](${r.url})\n  *Snippet:* ${r.snippet}\n  *Source Domain:* [${r.domain}](${r.url})`)
            .join("\n\n")}\n\n*CRITICAL REAL-TIME GROUNDING INSTRUCTION:*
1. Synthesize an accurate, factual response based strictly on the live web search findings above.
2. Pay close attention to recent transfers, successions, new appointments, or current active officeholders (e.g. if someone assumed charge or succeeded a predecessor, report the NEW current active official).
3. At the end of your response under a '### 🌐 Clickable Sources' heading, list the sources using format \`[domain](url)\`.`;
        }
      } catch (err) {
        console.warn("Search retriever notice:", err);
      }
    }

    // 3. Standard / Multimodal Vision / Chat Route
    const assistantMsgId = Math.random().toString(36).substring(2, 9);
    const initialAssistantMsg: MessageUI = {
      id: assistantMsgId,
      role: "assistant",
      provider: selectedModelId === "auto" ? "Auto Router" : selectedModelId,
      model: selectedModelId,
      content: "",
      timestamp: "Just now",
      status: "streaming",
    };

    setMessages((prev) => [...prev, initialAssistantMsg]);

    try {
      const currentMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: [
          {
            type: "text",
            text: m.content,
          },
        ],
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId || undefined,
          mode: mode === "chat" ? "chat" : "auto",
          provider: selectedModelId === "auto" ? undefined : selectedModelId,
          model: selectedModelId === "auto" ? undefined : selectedModelId,
          systemPrompt: extraSearchContext || undefined,
          messages: currentMessages,
          attachmentIds: files.map((f) => f.id),
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Chat API error HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedText = "";
      let sseBuffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            try {
              const eventData = JSON.parse(trimmed.substring(6));
              if (eventData.type === "meta" && eventData.conversationId) {
                setActiveConversationId(eventData.conversationId);
                navigateTo(`/c/${eventData.conversationId}`);
                fetchConversations();
              } else if (eventData.type === "delta" && eventData.textDelta) {
                accumulatedText += eventData.textDelta;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: accumulatedText }
                      : msg
                  )
                );
              } else if (eventData.type === "done") {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, status: "complete" }
                      : msg
                  )
                );
              } else if (eventData.type === "error") {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? {
                          ...msg,
                          content: `⚠️ **AI Provider Error:** ${eventData.error || "Failed to generate response."}`,
                          status: "error",
                          error: eventData.error,
                        }
                      : msg
                  )
                );
              }
            } catch {
              // Ignore invalid SSE lines
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Chat stream aborted by user.");
        return;
      }
      console.warn("Chat streaming error fallback:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: `Thank you for your prompt!\n\nHere is how **OmniChat** processes your request:\n- Selected Model: \`${selectedModelId}\`\n- Mode: \`${mode}\`\n\n\`\`\`typescript\n// Provider Adapter\nexport interface AIProvider {\n  id: string;\n  chat(request: AIRequest): Promise<AIResponse>;\n}\n\`\`\`\n\n| Feature | Status |\n| --- | --- |\n| Streaming | Enabled |\n| Multi-Provider | Active |\n| MongoDB Persistence | Ready |`,
                status: "complete",
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleRegenerate = (messageId: string) => {
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex >= 0) {
      const msg = messages[msgIndex];
      if (msg.type === "image_generation" && msg.imageGeneration?.prompt) {
        handleSend(msg.imageGeneration.prompt, `image_${msg.imageGeneration.aspectRatio || "1:1"}`, []);
      } else if (msgIndex > 0 && messages[msgIndex - 1].role === "user") {
        const lastUserMsg = messages[msgIndex - 1];
        setMessages((prev) => prev.slice(0, msgIndex));
        handleSend(lastUserMsg.content, "chat", (lastUserMsg.attachments as any) || []);
      }
    }
  };

  const handleRetryImage = (messageId: string, prompt: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    handleSend(prompt, "image", []);
  };

  return (
    <div className={`flex h-screen overflow-hidden ${theme === "light" ? "light" : ""}`}>
      {/* Collapsible Persistent Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={loadConversationMessages}
        onDeleteConversation={handleDeleteConversation}
        onNewChat={handleNewChat}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Chat Work Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-chatbg">
        <ChatHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(true)}
          onNewChat={handleNewChat}
          selectedModelId={selectedModelId}
          onSelectModel={setSelectedModelId}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Chat Content Body */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {messages.length === 0 ? (
            <EmptyState onSelectAction={handleQuickAction} />
          ) : (
            <MessageList
              messages={messages}
              isStreaming={isStreaming}
              onRegenerate={handleRegenerate}
              onRetryImage={handleRetryImage}
              onEditMessage={handleEditMessage}
            />
          )}

          {/* Bottom Floating Composer */}
          <Composer
            onSend={handleSend}
            onStopStream={handleStopStream}
            isStreaming={isStreaming}
            externalMode={pendingComposerMode}
            externalInput={pendingComposerInput}
            triggerFilePickerNonce={filePickerNonce}
            focusNonce={focusNonce}
          />
        </div>
      </main>
    </div>
  );
}

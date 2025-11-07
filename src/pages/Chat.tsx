import { BottomNav } from "@/components/BottomNav";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, BookOpen, Briefcase, FileText, Heart, Calendar, Lightbulb, Paperclip, X, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ionConnectAvatar from "@/assets/ionconnect-avatar.png";
import { FlashcardSet, parseFlashcards } from "@/components/Flashcard";

type Attachment = {
  type: "link" | "file";
  name: string;
  url?: string;
  data?: string;
  mimeType?: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
};

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi Rohan! I'm **AURA**, your AI campus companion. 🌱\n\nI can help you with:\n📚 Study plans & concept explanations\n💼 Career guidance & placement prep\n📝 Document generation (letters, certificates)\n💪 Wellness check-ins & motivation\n📅 Task planning & reminders\n\nTry a quick action below or just tell me what's on your mind!"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const quickActions = [
    { icon: BookOpen, label: "Study Plan", prompt: "Create a 5-day revision plan for DSA" },
    { icon: Briefcase, label: "Career Match", prompt: "Which companies match my skills and CGPA?" },
    { icon: FileText, label: "Generate Letter", prompt: "Generate a permission letter for attending a hackathon" },
    { icon: Heart, label: "Wellness Check", prompt: "I'm feeling stressed about upcoming exams" },
    { icon: Calendar, label: "My Schedule", prompt: "What are my upcoming deadlines and how should I prepare?" },
    { icon: Lightbulb, label: "Startup Idea", prompt: "Suggest 3 startup ideas based on AI and sustainability" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const streamChat = async (userMessage: Message) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aura-chat`;
    
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          toast({
            title: "Rate limit exceeded",
            description: "Please wait a moment before sending another message.",
            variant: "destructive",
          });
          return;
        }
        if (resp.status === 402) {
          toast({
            title: "Credits exhausted",
            description: "Please add credits to continue using AURA.",
            variant: "destructive",
          });
          return;
        }
        throw new Error("Failed to start chat stream");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let assistantContent = "";

      // Add empty assistant message
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantContent
                };
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush remaining buffer
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantContent
                };
                return newMessages;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to get response from AURA. Please try again.",
        variant: "destructive",
      });
      // Remove the empty assistant message on error
      setMessages(prev => prev.slice(0, -1));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 20MB limit`,
          variant: "destructive",
        });
        continue;
      }

      const reader = new FileReader();
      const attachment = await new Promise<Attachment>((resolve) => {
        reader.onload = (e) => {
          resolve({
            type: "file",
            name: file.name,
            data: e.target?.result as string,
            mimeType: file.type,
          });
        };
        reader.readAsDataURL(file);
      });
      newAttachments.push(attachment);
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    
    setAttachments((prev) => [
      ...prev,
      { type: "link", name: linkUrl, url: linkUrl },
    ]);
    setLinkUrl("");
    setShowLinkInput(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (customInput?: string) => {
    const messageText = customInput || input;
    if ((!messageText.trim() && attachments.length === 0) || isLoading) return;

    const userMessage: Message = { 
      role: "user", 
      content: messageText.trim() || "Here are some attachments:",
      attachments: attachments.length > 0 ? attachments : undefined,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setAttachments([]);
    setIsLoading(true);

    await streamChat(userMessage);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      {/* Header */}
      <header className="bg-card text-foreground p-4 border-b border-border/50 flex items-center gap-3">
        <img src={ionConnectAvatar} alt="AURA" className="w-10 h-10 rounded-full" />
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            AURA <Sparkles className="w-4 h-4 text-primary" />
          </h1>
          <p className="text-xs text-muted-foreground">AI Campus Companion</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <img src={ionConnectAvatar} alt="AURA" className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border/50"
              }`}
            >
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mb-2 space-y-1">
                  {msg.attachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs opacity-80">
                      {att.type === "link" ? (
                        <LinkIcon className="w-3 h-3" />
                      ) : att.mimeType?.startsWith("image/") ? (
                        <img src={att.data} alt={att.name} className="max-w-[200px] rounded" />
                      ) : (
                        <Paperclip className="w-3 h-3" />
                      )}
                      {att.type !== "file" || !att.mimeType?.startsWith("image/") ? (
                        <span className="truncate">{att.name}</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Check if message contains flashcards */}
              {(() => {
                const flashcards = msg.role === "assistant" ? parseFlashcards(msg.content) : null;
                if (flashcards) {
                  // Split content into before and after flashcards
                  const flashcardStart = msg.content.indexOf("**Flashcard");
                  const beforeFlashcards = msg.content.substring(0, flashcardStart).trim();
                  const afterFlashcardsMatch = msg.content.match(/---\n\*\*Next Step:\*\*(.*)/s);
                  const afterFlashcards = afterFlashcardsMatch ? afterFlashcardsMatch[0] : "";
                  
                  return (
                    <>
                      {beforeFlashcards && (
                        <p className="text-sm whitespace-pre-wrap mb-3">{beforeFlashcards}</p>
                      )}
                      <FlashcardSet cards={flashcards} />
                      {afterFlashcards && (
                        <p className="text-sm whitespace-pre-wrap mt-3">{afterFlashcards}</p>
                      )}
                    </>
                  );
                }
                return <p className="text-sm whitespace-pre-wrap">{msg.content}</p>;
              })()}
            </div>
          </div>
        ))}
        
        {/* Quick Actions - Show only when just the welcome message exists */}
        {messages.length === 1 && messages[0].role === "assistant" && !isLoading && (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground text-center font-medium">Quick Actions:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="h-auto py-3 px-3 flex flex-col items-center gap-2 text-xs hover:bg-accent/50 hover:border-primary/50 transition-colors"
                  onClick={() => handleSend(action.prompt)}
                >
                  <action.icon className="h-5 w-5 text-primary" />
                  <span className="text-center leading-tight">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {isLoading && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content === "" && (
          <div className="flex gap-3">
            <img src={ionConnectAvatar} alt="AURA" className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
            <div className="bg-card border border-border/50 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 bg-card p-4">
        <div className="max-w-screen-xl mx-auto space-y-2">
          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-accent/50 px-3 py-1.5 rounded-lg text-xs"
                >
                  {att.type === "link" ? (
                    <LinkIcon className="w-3 h-3" />
                  ) : att.mimeType?.startsWith("image/") ? (
                    <img src={att.data} alt={att.name} className="w-6 h-6 rounded object-cover" />
                  ) : (
                    <Paperclip className="w-3 h-3" />
                  )}
                  <span className="truncate max-w-[150px]">{att.name}</span>
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Link input */}
          {showLinkInput && (
            <div className="flex gap-2">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Paste URL here..."
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-input bg-background"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddLink();
                  if (e.key === "Escape") setShowLinkInput(false);
                }}
                autoFocus
              />
              <Button size="sm" onClick={handleAddLink}>Add</Button>
              <Button size="sm" variant="outline" onClick={() => setShowLinkInput(false)}>
                Cancel
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex gap-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="*/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="h-[60px] w-[60px] rounded-xl flex-shrink-0"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowLinkInput(!showLinkInput)}
                disabled={isLoading}
                className="h-[60px] w-[60px] rounded-xl flex-shrink-0"
              >
                <LinkIcon className="w-5 h-5" />
              </Button>
            </div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AURA anything..."
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSend()}
              disabled={(!input.trim() && attachments.length === 0) || isLoading}
              size="icon"
              className="h-[60px] w-[60px] rounded-xl flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Chat;

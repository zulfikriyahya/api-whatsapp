"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  MoreVertical,
  Send,
  Paperclip,
  Loader2,
  MessageSquare,
  Phone,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

interface ChatItem {
  id: string; // Group ID (remote number)
  name: string;
  number: string;
  lastMessage: string;
  time: string;
  isGroup: boolean;
  unreadCount: number;
}

interface MessageItem {
  id: string;
  text: string;
  isMe: boolean;
  time: string;
  status: "PENDING" | "SENT" | "DELIVERED" | "READ";
}

export default function InboxPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"private" | "group">("private");
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations list
  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/inbox/conversations");
      const json = await res.json();
      if (json.success) setChats(json.data);
    } catch (error) {
      console.error("Failed to fetch chats", error);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // Polling inbox list
    return () => clearInterval(interval);
  }, []);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;

    setLoadingMessages(true);
    const fetchMsgs = async () => {
      try {
        const res = await fetch(`/api/inbox/messages?chatId=${selectedChat}`);
        const json = await res.json();
        if (json.success) setMessages(json.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMsgs();
    // Realtime polling for active chat
    const interval = setInterval(fetchMsgs, 3000);
    return () => clearInterval(interval);
  }, [selectedChat]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredChats = chats.filter((c) =>
    activeTab === "group" ? c.isGroup : !c.isGroup,
  );

  const handleSend = async () => {
    if (!inputText.trim() || !selectedChat) return;

    const textToSend = inputText;
    setInputText(""); // Clear input immediately (Optimistic)

    // Optimistic Update
    const tempId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text: textToSend,
        isMe: true,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "PENDING",
      },
    ]);

    try {
      // Send API Request
      // Note: For simplicity, we assume the backend finds the best device or last used device for this chat
      await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // In a real scenario, you'd pass the specific deviceId associated with this chat thread
          // Here we might rely on backend logic to pick active device for the user
          toNumber: selectedChat,
          message: textToSend,
          // deviceId: "auto" // Backend handles this
        }),
      });

      // Refresh messages to get real ID and status
      const res = await fetch(`/api/inbox/messages?chatId=${selectedChat}`);
      const json = await res.json();
      if (json.success) setMessages(json.data);
    } catch (e) {
      console.error("Send failed", e);
      // Handle error state visually if needed
    }
  };

  const selectedChatData = chats.find((c) => c.id === selectedChat);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Sidebar List */}
      <div
        className={cn(
          "w-full md:w-80 flex flex-col glass-card rounded-2xl overflow-hidden transition-all",
          selectedChat ? "hidden md:flex" : "flex",
        )}>
        <div className="p-4 border-b border-border bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Inbox
          </h2>
          <div className="flex bg-muted/50 p-1 rounded-xl mb-4">
            <button
              onClick={() => setActiveTab("private")}
              className={cn(
                "flex-1 py-1.5 text-sm font-medium rounded-lg transition-all",
                activeTab === "private"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}>
              Private
            </button>
            <button
              onClick={() => setActiveTab("group")}
              className={cn(
                "flex-1 py-1.5 text-sm font-medium rounded-lg transition-all",
                activeTab === "group"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}>
              Groups
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/30 border border-input text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="Search conversations..."
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loadingChats ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 className="animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading chats...</p>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 p-4 text-center">
              <MessageSquare size={40} className="mb-2" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={cn(
                  "p-4 flex gap-3 cursor-pointer transition-all hover:bg-muted/40 border-b border-border/30 last:border-0",
                  selectedChat === chat.id &&
                    "bg-primary/10 border-l-4 border-l-primary pl-3",
                )}>
                <Avatar className="h-10 w-10 border border-border/50">
                  <AvatarFallback
                    className={cn(
                      "font-bold text-white",
                      selectedChat === chat.id
                        ? "bg-primary"
                        : "bg-gradient-to-br from-gray-400 to-gray-500",
                    )}>
                    {chat.name?.substring(0, 2).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-semibold truncate text-sm text-foreground">
                      {chat.name || chat.number}
                    </h4>
                    <span className="text-[10px] text-muted-foreground">
                      {chat.time}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground truncate w-full pr-2">
                      {chat.lastMessage}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="min-w-[1.25rem] h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div
        className={cn(
          "flex-1 flex flex-col glass-card rounded-2xl overflow-hidden transition-all",
          !selectedChat ? "hidden md:flex" : "flex",
        )}>
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-3 md:p-4 border-b border-border flex justify-between items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-md z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-2 -ml-2 mr-1 hover:bg-muted rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                    {selectedChatData?.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-sm md:text-base">
                    {selectedChatData?.name || selectedChat}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedChatData?.number}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-primary transition-colors">
                  <Phone size={18} />
                </button>
                <button className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-primary transition-colors">
                  <Video size={18} />
                </button>
                <button className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-primary transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 bg-[url('/chat-bg-pattern.png')] bg-repeat bg-[length:400px] bg-opacity-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-background/90 backdrop-blur-[2px]" />{" "}
              {/* Overlay for better text readability */}
              <div className="relative h-full overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {loadingMessages && messages.length === 0 ? (
                  <div className="flex justify-center pt-10">
                    <Loader2 className="animate-spin text-primary" />
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex w-full animate-in slide-in-from-bottom-2 duration-300",
                        msg.isMe ? "justify-end" : "justify-start",
                      )}>
                      <div
                        className={cn(
                          "px-4 py-2 rounded-2xl shadow-sm max-w-[85%] md:max-w-[70%] relative group",
                          msg.isMe
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-white dark:bg-slate-800 border border-border/50 rounded-tl-sm",
                        )}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {msg.text}
                        </p>
                        <div
                          className={cn(
                            "text-[10px] mt-1 flex justify-end items-center gap-1 opacity-70",
                            msg.isMe
                              ? "text-primary-foreground"
                              : "text-muted-foreground",
                          )}>
                          <span>{msg.time}</span>
                          {msg.isMe && (
                            <span>
                              {msg.status === "READ"
                                ? "✓✓"
                                : msg.status === "DELIVERED"
                                  ? "✓✓"
                                  : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-3 md:p-4 border-t border-border bg-white/60 dark:bg-slate-900/60 backdrop-blur-md z-10">
              <div className="flex items-end gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border/50">
                <button className="p-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
                  <Paperclip size={20} />
                </button>
                <textarea
                  className="flex-1 max-h-32 min-h-[44px] py-2.5 px-2 bg-transparent outline-none text-sm resize-none scrollbar-hide"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="p-3 bg-primary text-primary-foreground rounded-xl hover:shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:shadow-none shrink-0">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-40 select-none">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6 animate-pulse">
              <MessageSquare size={48} />
            </div>
            <h3 className="text-xl font-bold mb-2">Welcome to Inbox</h3>
            <p className="text-sm max-w-xs text-center">
              Select a conversation from the sidebar to start chatting or view
              messages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

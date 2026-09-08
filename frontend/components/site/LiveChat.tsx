"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  id: number;
  from: "user" | "support";
  text: string;
  time: string;
};

const AUTO_REPLY =
  "ขอบคุณที่ติดต่อมาครับ ทีมงาน ICS ได้รับข้อความของคุณแล้ว เจ้าหน้าที่จะตอบกลับภายใน 5–15 นาทีครับ 😊";

function getTime() {
  return new Date().toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LiveChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: "support",
      text: "สวัสดีครับ! 👋 มีอะไรให้ ICS ช่วยเหลือได้บ้างครับ?",
      time: "",
    },
  ]);

  // Set initial message time only on client to avoid SSR hydration mismatch
  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) => (m.id === 0 && m.time === "" ? { ...m, time: getTime() } : m))
    );
  }, []);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(0);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, typing]);

  function sendMessage() {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now(),
      from: "user",
      text,
      time: getTime(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      const reply: Message = {
        id: Date.now() + 1,
        from: "support",
        text: AUTO_REPLY,
        time: getTime(),
      };
      setMessages((prev) => [...prev, reply]);
      if (!open) setUnread((n) => n + 1);
    }, 1500);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") sendMessage();
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Window */}
      <div
        className={`transition-all duration-300 origin-bottom-right ${
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#dde0e4] overflow-hidden flex flex-col"
          style={{ maxHeight: "480px" }}>
          {/* Header */}
          <div className="bg-[#1877f2] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">ICS</span>
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#1877f2] rounded-full" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">ICS Support</p>
                <p className="text-white/70 text-xs">ออนไลน์ · พร้อมให้บริการ</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              aria-label="ปิด"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-[#f0f2f5]"
            style={{ minHeight: "260px", maxHeight: "300px" }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} gap-2`}
              >
                {msg.from === "support" && (
                  <div className="w-7 h-7 rounded-full bg-[#1877f2] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-[9px] font-bold">ICS</span>
                  </div>
                )}
                <div className="max-w-[75%]">
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.from === "user"
                        ? "bg-[#1877f2] text-white rounded-br-sm"
                        : "bg-white text-[#1c1e21] rounded-bl-sm shadow-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <p className="text-[10px] text-[#65676b] mt-1" style={{ textAlign: msg.from === "user" ? "right" : "left" }}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start gap-2">
                <div className="w-7 h-7 rounded-full bg-[#1877f2] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-[9px] font-bold">ICS</span>
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#65676b] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-[#65676b] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-[#65676b] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 bg-white border-t border-[#dde0e4] flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="พิมพ์ข้อความ..."
              className="flex-1 text-sm bg-[#f0f2f5] rounded-full px-4 py-2.5 outline-none placeholder:text-[#65676b] text-[#1c1e21] focus:ring-2 focus:ring-[#1877f2]/30"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-full bg-[#1877f2] flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-[#166fe5] transition-colors"
              aria-label="ส่งข้อความ"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-[#1877f2] hover:bg-[#166fe5] shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label="เปิด/ปิด Live Chat"
      >
        {/* Unread badge */}
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}

        <span className={`transition-all duration-200 ${open ? "rotate-90 opacity-0 absolute" : "rotate-0 opacity-100"}`}>
          {/* Chat icon */}
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        </span>
        <span className={`transition-all duration-200 ${open ? "rotate-0 opacity-100" : "-rotate-90 opacity-0 absolute"}`}>
          {/* Close icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </span>
      </button>
    </div>
  );
}

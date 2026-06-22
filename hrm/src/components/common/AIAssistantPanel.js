import React, { useEffect, useRef, useState } from "react";
import { FaPaperPlane, FaRobot, FaShieldAlt, FaWrench } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../utils/api";

const QUICK_PROMPTS = [
    "Leave balance is not showing",
    "I cannot see my attendance report",
    "Profile photo is not updating",
    "Employee cannot access payroll",
    "Document upload issue",
];

function nowTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AIAssistantPanel({ user }) {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            text: "Hello. I am the WorkSphere company bot. I can help with profile, leave, attendance, reports, payroll, employees, login, permissions, branding, documents, and company modules. I do not answer general knowledge questions.",
            time: nowTime(),
        },
    ]);
    const [text, setText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isSending]);

    const sendMessage = async (value = text) => {
        const message = String(value || "").trim();
        if (!message || isSending) return;

        setIsSending(true);
        setText("");
        setMessages((prev) => [...prev, { role: "user", text: message, time: nowTime() }]);

        try {
            const history = messages
                .slice(-8)
                .map((item) => ({ role: item.role, text: item.text }));
            const { data } = await api.post("/assistant/chat", { message, history });
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text: data?.answer || "I checked, but no response was returned.",
                    checks: data?.checks || [],
                    time: nowTime(),
                },
            ]);
        } catch (error) {
            console.error("AI assistant error", error);
            toast.error(error?.response?.data?.message || "Assistant failed to respond.");
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text: "Sorry, the assistant cannot respond right now. Please check the backend/API status.",
                    time: nowTime(),
                },
            ]);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex-1 min-h-0 flex flex-col bg-slate-50">
            <div className="px-3 py-2 border-b bg-white">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-customRed/10 text-customRed flex items-center justify-center">
                        <FaRobot />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 uppercase tracking-wide">WorkSphere Bot</div>
                        <div className="text-[10px] text-slate-500 truncate">
                            Company help for {user?.company_name || user?.company_code || "your portal"}
                        </div>
                    </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700 px-2 py-1 flex items-center gap-1">
                        <FaShieldAlt className="shrink-0" /> Permission scoped
                    </div>
                    <div className="rounded-lg border border-amber-100 bg-amber-50 text-amber-700 px-2 py-1 flex items-center gap-1">
                        <FaWrench className="shrink-0" /> Company topics only
                    </div>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
                {messages.map((message, index) => {
                    const isUser = message.role === "user";
                    return (
                        <div key={`${message.role}-${index}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs shadow-sm whitespace-pre-wrap break-words ${isUser
                                    ? "bg-customRed text-white rounded-tr-none"
                                    : "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                                    }`}
                            >
                                {!isUser && (
                                    <div className="text-[9px] font-black uppercase tracking-wider text-customRed mb-1">
                                        Assistant
                                    </div>
                                )}
                                <div>{message.text}</div>
                                <div className={`text-[9px] mt-1 text-right ${isUser ? "text-white/70" : "text-slate-400"}`}>
                                    {message.time}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {isSending && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-3 py-2 text-xs text-slate-500 shadow-sm">
                            Checking safely...
                        </div>
                    </div>
                )}
            </div>

            <div className="px-3 py-2 border-t bg-white space-y-2">
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {QUICK_PROMPTS.map((prompt) => (
                        <button
                            key={prompt}
                            type="button"
                            onClick={() => sendMessage(prompt)}
                            disabled={isSending}
                            className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:border-customRed hover:text-customRed disabled:opacity-50"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        sendMessage();
                    }}
                    className="flex items-center gap-2"
                >
                    <input
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        placeholder="Ask about profile, reports, leave, payroll..."
                        className="flex-1 min-w-0 text-xs border rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-customRed"
                        autoComplete="off"
                    />
                    <button
                        type="submit"
                        disabled={!text.trim() || isSending}
                        className="bg-customRed text-white p-2 rounded-full disabled:opacity-50 shadow-md flex items-center justify-center w-8 h-8 shrink-0"
                        aria-label="Send assistant message"
                    >
                        <FaPaperPlane className="w-3.5 h-3.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}

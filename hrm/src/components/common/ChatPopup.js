import React, { useState, useEffect, useRef } from "react";
import { FaComments, FaTimes, FaPaperPlane, FaChevronDown, FaChevronUp, FaUserShield, FaUsers, FaPaperclip, FaFileAlt, FaMicrophone, FaStop, FaTrash, FaFilePdf, FaFileWord, FaFileExcel, FaFilePowerpoint, FaFileArchive, FaFileVideo, FaDownload, FaRobot } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import api, { BASE_URL } from "../../utils/api";
import { toast } from "react-toastify";
import socket from "../../utils/socket";
import VoiceNotePlayer from "./VoiceNotePlayer";
import AIAssistantPanel from "./AIAssistantPanel";

export default function ChatPopup() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [activeTab, setActiveTab] = useState("dept"); // 'dept', 'auth', or 'ai'
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [rooms, setRooms] = useState([]); // For Admins/HR
    const [selectedRoomId, setSelectedRoomId] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const fileInputRef = useRef(null);

    // Voice Recording States
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);
    const audioChunksRef = useRef([]);

    const scrollRef = useRef(null);
    const lastSeenRef = useRef({}); // { roomId: lastId }
    const prevUnreadRef = useRef(0);

    const isAdmin = user?.roles?.some(r => ["admin", "super_admin", "hr"].includes(r.toLowerCase())) ||
        ["admin", "super_admin", "hr"].includes(user?.role?.toLowerCase()) ||
        (user?.flags?.level >= 10);

    const deptName = user?.Department || 'General';
    const deptRoomId = `DEPT_${deptName}`;
    const authRoomId = `AUTH_${user?.id}`;

    // Load last seen from local storage
    useEffect(() => {
        const stored = localStorage.getItem(`chat_last_seen_${user?.id}`);
        if (stored) lastSeenRef.current = JSON.parse(stored);
    }, [user]);

    // Save last seen
    const markAsSeen = (roomId, msgId) => {
        if (!msgId) return;
        lastSeenRef.current[roomId] = msgId;
        localStorage.setItem(`chat_last_seen_${user?.id}`, JSON.stringify(lastSeenRef.current));
        calculateUnread(messages);
    };

    const calculateUnread = (allMsgs) => {
        if (!allMsgs.length) return;
        const lastId = lastSeenRef.current[selectedRoomId] || 0;
        const unread = allMsgs.filter(m => m.id > lastId && Number(m.sender_id) !== Number(user.id)).length;
        setUnreadCount(unread);
    };

    // Use dept room by default for non-admins, if admin they might want to switch
    useEffect(() => {
        if (!selectedRoomId) {
            if (activeTab === 'dept') {
                setSelectedRoomId(deptRoomId);
            } else if (activeTab === 'auth' && !isAdmin && authRoomId) {
                setSelectedRoomId(authRoomId);
            }
        }
    }, [activeTab, deptRoomId, authRoomId, isAdmin, selectedRoomId]);

    const handleMarkAsRead = async (roomId) => {
        if (!roomId || !isOpen || minimized) return;
        try {
            await api.post(`/chat/read/${encodeURIComponent(roomId)}`);
        } catch (err) {
            if (err?.response?.status !== 403) {
                console.error("handleMarkAsRead error", err);
            }
        }
    };

    const fetchMessages = async () => {
        if (activeTab === "ai") return;
        if (!selectedRoomId) return;
        try {
            const { data } = await api.get(`/chat/messages/${selectedRoomId}`);
            setMessages(data);
            if (isOpen && !minimized) {
                const lastMsg = data[data.length - 1];
                if (lastMsg) markAsSeen(selectedRoomId, lastMsg.id);
            } else {
                calculateUnread(data);
            }
        } catch (e) {
            console.error("fetchMessages error", e);
        }
    };

    const fetchRooms = async () => {
        if (!isAdmin || !isOpen || activeTab !== 'auth') return;
        try {
            const { data } = await api.get("/chat/rooms");
            setRooms(data);
        } catch (e) {
            console.error("fetchRooms error", e);
        }
    };

    const fetchUnreadCounts = async () => {
        if (activeTab === "ai") return;
        if (isOpen && !minimized) return;

        const roomIdsList = [deptRoomId];
        const lastIdsList = [lastSeenRef.current[deptRoomId] || 0];

        if (isAdmin) {
            roomIdsList.push("TOTAL_AUTH");
            const authLastSeen = Object.entries(lastSeenRef.current)
                .filter(([k]) => k.startsWith("AUTH_"))
                .reduce((max, [_, v]) => Math.max(max, v), 0);
            lastIdsList.push(authLastSeen);
        } else if (authRoomId) {
            roomIdsList.push(authRoomId);
            lastIdsList.push(lastSeenRef.current[authRoomId] || 0);
        }

        const roomIds = roomIdsList.join(",");
        const lastIds = lastIdsList.join(",");

        try {
            const { data } = await api.get(`/chat/unread?roomIds=${roomIds}&lastIds=${lastIds}`);
            const total = Object.values(data).reduce((sum, val) => sum + Number(val), 0);
            setUnreadCount(total);
        } catch (e) {
            console.error("fetchUnreadCounts error", e);
        }
    };

    useEffect(() => {
        if (isOpen && !minimized) {
            fetchMessages();
            handleMarkAsRead(selectedRoomId);
        } else {
            fetchUnreadCounts();
            const interval = setInterval(fetchUnreadCounts, 30000);
            return () => clearInterval(interval);
        }
    }, [selectedRoomId, isOpen, minimized, deptRoomId, authRoomId, activeTab]);

    useEffect(() => {
        if (!socket) return;

        socket.on("chat_message", (newMsg) => {
            if (activeTab === "ai") return;
            if (newMsg.room_id === selectedRoomId) {
                setMessages(prev => [...prev, newMsg]);
                if (isOpen && !minimized) {
                    handleMarkAsRead(selectedRoomId);
                }
            } else {
                fetchUnreadCounts();
            }
        });

        socket.on("chat_read", (data) => {
            if (activeTab === "ai") return;
            if (data.roomId === selectedRoomId) {
                fetchMessages();
            }
        });

        return () => {
            socket.off("chat_message");
            socket.off("chat_read");
        };
    }, [selectedRoomId, isOpen, minimized, activeTab]);

    useEffect(() => {
        if (isAdmin && unreadCount > prevUnreadRef.current) {
            if (!isOpen || minimized) {
                toast.info("📩 New Support Message Received", {
                    position: "bottom-right",
                    autoClose: 5000,
                    onClick: () => {
                        setIsOpen(true);
                        setMinimized(false);
                        setActiveTab("auth");
                    }
                });
            }
        }
        prevUnreadRef.current = unreadCount;
    }, [unreadCount, isAdmin, isOpen, minimized]);

    useEffect(() => {
        const handleOpenAuth = () => {
            setIsOpen(true);
            setMinimized(false);
            setActiveTab("auth");
        };
        window.addEventListener("open-chat-auth", handleOpenAuth);
        return () => window.removeEventListener("open-chat-auth", handleOpenAuth);
    }, []);

    useEffect(() => {
        if (isAdmin && activeTab === "auth" && isOpen) {
            fetchRooms();
        }
    }, [activeTab, isAdmin, isOpen]);

    useEffect(() => {
        if (scrollRef.current && isOpen && !minimized) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, minimized, filePreview]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error("File excessively large! Please keep it under 10MB.");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setSelectedFile(file);
        if (file.type.startsWith("image/")) {
            setFilePreview(URL.createObjectURL(file));
        } else {
            setFilePreview(null);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        setAudioBlob(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // --- Voice Recording Functions ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Enhanced audio quality settings
            const options = {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 128000  // 128 kbps for better quality
            };

            // Fallback for browsers that don't support opus
            let mediaRecorder;
            try {
                mediaRecorder = new MediaRecorder(stream, options);
            } catch (e) {
                console.warn('Opus codec not supported, using default:', e);
                mediaRecorder = new MediaRecorder(stream);
            }

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                // Create a "file" from blob for sending
                const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
                setSelectedFile(file);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            toast.error("Microphone access denied or not available.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const discardRecording = () => {
        stopRecording();
        setAudioBlob(null);
        setSelectedFile(null);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const [isSending, setIsSending] = useState(false);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        const val = text.trim();
        if ((!val && !selectedFile) || !selectedRoomId || isSending) return;

        setIsSending(true);
        const formData = new FormData();
        formData.append("roomId", selectedRoomId);
        formData.append("message", val);
        if (selectedFile) {
            formData.append("file", selectedFile);
        }

        try {
            await api.post("/chat/send", formData);
            // ONLY CLEAR AFTER SUCCESS
            setText("");
            clearFile();
            fetchMessages();
        } catch (err) {
            console.error("handleSend error", err);
            toast.error("Failed to send message. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    if (!user) return null;

    // Helper to build absolute URL for attachments
    const getFileUrl = (path) => {
        if (!path) return "";
        // BASE_URL is typically 'http://localhost:5000' or similar
        return `${BASE_URL.replace(/\/api\/v1\/?$/, "")}${path}`;
    };

    return (
        <div className="fixed inset-x-2 bottom-2 sm:inset-x-auto sm:bottom-4 sm:right-4 z-[80] sm:z-[900] max-w-[calc(100vw-1rem)] sm:max-w-none">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    aria-label="Open chat"
                    className="relative bg-customRed text-white p-3 sm:p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2"
                >
                    <FaComments size={20} className="sm:w-6 sm:h-6" />
                    <span className="font-semibold hidden sm:inline">Chat</span>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-white text-customRed text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-customRed animate-bounce">
                            {unreadCount}
                        </span>
                    )}
                </button>
            ) : (
                <div className={`bg-white rounded-xl shadow-2xl border flex flex-col transition-all duration-300 overflow-hidden ${minimized
                        ? 'h-12 w-full sm:w-80'
                        : 'h-[min(560px,calc(100dvh-1rem))] w-full sm:h-[550px] sm:w-96 md:w-[420px] lg:w-[450px]'
                    }`}>
                    {/* Header */}
                    <div className="bg-customRed text-white px-3 py-3 rounded-t-xl flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2 truncate min-w-0">
                            <FaComments className="shrink-0" />
                            <span className="font-bold text-xs sm:text-sm truncate">
                                {activeTab === 'ai'
                                    ? 'WorkSphere Company Bot'
                                    : activeTab === 'dept'
                                    ? `Dept: ${deptName === 'General' ? 'Company Chat' : deptName}`
                                    : (isAdmin && selectedRoomId
                                        ? (() => {
                                            const r = rooms.find(rm => rm.room_id === selectedRoomId);
                                            return r ? `${r.user_name} (${r.designation})` : 'Higher Authorities';
                                        })()
                                        : 'Higher Authorities')
                                }
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                onClick={() => setMinimized(!minimized)}
                                className="p-1.5 rounded-lg hover:bg-white/10"
                                aria-label={minimized ? "Expand chat" : "Minimize chat"}
                            >
                                {minimized ? <FaChevronUp /> : <FaChevronDown />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-white/10"
                                aria-label="Close chat"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    </div>

                    {!minimized && (
                        <>
                            {/* Tabs */}
                            <div className="flex border-b text-[11px] sm:text-xs font-semibold uppercase shrink-0">
                                <button
                                    onClick={() => { setActiveTab("dept"); setSelectedRoomId(deptRoomId); }}
                                    className={`flex-1 py-2 flex items-center justify-center gap-1 ${activeTab === "dept" ? "text-customRed border-b-2 border-customRed" : "text-gray-500"}`}
                                    aria-label="Open department chat"
                                >
                                    <FaUsers /> Dept
                                </button>
                                <button
                                    onClick={() => { setActiveTab("auth"); setSelectedRoomId(isAdmin ? "" : authRoomId); }}
                                    className={`flex-1 py-2 flex items-center justify-center gap-1 ${activeTab === "auth" ? "text-customRed border-b-2 border-customRed" : "text-gray-500"}`}
                                    aria-label="Open authority chat"
                                >
                                    <FaUserShield /> Authority
                                </button>
                                <button
                                    onClick={() => setActiveTab("ai")}
                                    className={`flex-1 py-2 flex items-center justify-center gap-1 ${activeTab === "ai" ? "text-customRed border-b-2 border-customRed" : "text-gray-500"}`}
                                    aria-label="Open company bot"
                                >
                                    <FaRobot /> Bot
                                </button>
                            </div>

                            {/* Authority Room List for Admins */}
                            {activeTab === "ai" ? (
                                <AIAssistantPanel user={user} />
                            ) : isAdmin && activeTab === "auth" && !selectedRoomId ? (
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase px-2">Support Threads</h4>
                                    {rooms.length === 0 ? (
                                        <div className="text-center text-xs text-gray-400 mt-10">No active threads</div>
                                    ) : (
                                        rooms.map(r => (
                                            <button
                                                key={r.room_id}
                                                onClick={() => setSelectedRoomId(r.room_id)}
                                                className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-left border border-transparent hover:border-gray-200 transition-all"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0">
                                                    {r.profile_img ? <img src={r.profile_img} width="32" height="32" decoding="async" className="w-full h-full rounded-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">{r.user_name?.[0]}</div>}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-xs font-bold truncate">{r.user_name}</div>
                                                    <div className="text-[9px] text-gray-500 truncate">{r.designation} • {r.department}</div>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* Message Area */}
                                    <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gray-50/50" ref={scrollRef}>
                                        {isAdmin && activeTab === 'auth' && selectedRoomId && (
                                            <button onClick={() => setSelectedRoomId("")} className="text-[10px] text-customRed mb-2 hover:underline" aria-label="Back to support threads">← Back to threads</button>
                                        )}
                                        {messages.length === 0 ? (
                                            <div className="text-center text-xs text-gray-400 mt-10">Start the conversation...</div>
                                        ) : (
                                            messages.map((m) => {
                                                const isMe = Number(m.sender_id) === Number(user.id);
                                                return (
                                                    <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                                        <div className={`max-w-[86%] sm:max-w-[80%] rounded-2xl p-2.5 shadow-sm text-xs ${isMe ? "bg-customRed text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none border"}`}>
                                                            {!isMe && <div className="font-bold text-[9px] mb-1 opacity-70">{m.sender_name}</div>}
                                                            <div className="whitespace-pre-wrap break-words">{m.message}</div>

                                                            {/* Attachment Rendering */}
                                                            {m.file_url && (
                                                                <div className="mt-2 pt-2 border-t border-white/20">
                                                                    {m.file_type?.startsWith("image/") ? (
                                                                        <a href={getFileUrl(m.file_url)} target="_blank" rel="noopener noreferrer">
                                                                            <img
                                                                                src={getFileUrl(m.file_url)}
                                                                                alt={m.file_name}
                                                                                width="240"
                                                                                height="180"
                                                                                loading="lazy"
                                                                                decoding="async"
                                                                                className="max-w-full rounded-lg border border-white/10 hover:opacity-90 transition-opacity"
                                                                            />
                                                                        </a>
                                                                    ) : m.file_type?.startsWith("audio/") ? (
                                                                        <VoiceNotePlayer
                                                                            audioUrl={getFileUrl(m.file_url)}
                                                                            isMe={isMe}
                                                                        />
                                                                    ) : (
                                                                        <div className={`flex items-center gap-3 p-3 rounded-2xl max-w-[280px] ${isMe ? 'bg-white/10' : 'bg-white border border-gray-200'
                                                                            }`}>
                                                                            {/* File Icon */}
                                                                            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${isMe ? 'bg-white/20' : 'bg-gray-100'
                                                                                }`}>
                                                                                {m.file_type?.includes('pdf') ? (
                                                                                    <FaFilePdf className="text-red-500 text-2xl" />
                                                                                ) : m.file_type?.includes('word') || m.file_type?.includes('document') ? (
                                                                                    <FaFileWord className="text-blue-500 text-2xl" />
                                                                                ) : m.file_type?.includes('excel') || m.file_type?.includes('spreadsheet') ? (
                                                                                    <FaFileExcel className="text-green-600 text-2xl" />
                                                                                ) : m.file_type?.includes('powerpoint') || m.file_type?.includes('presentation') ? (
                                                                                    <FaFilePowerpoint className="text-orange-500 text-2xl" />
                                                                                ) : m.file_type?.includes('zip') || m.file_type?.includes('rar') ? (
                                                                                    <FaFileArchive className="text-yellow-600 text-2xl" />
                                                                                ) : m.file_type?.includes('video') ? (
                                                                                    <FaFileVideo className="text-purple-500 text-2xl" />
                                                                                ) : (
                                                                                    <FaFileAlt className={isMe ? 'text-white' : 'text-gray-500'} size={24} />
                                                                                )}
                                                                            </div>

                                                                            {/* File Info */}
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className={`text-xs font-semibold truncate ${isMe ? 'text-white' : 'text-gray-900'
                                                                                    }`}>
                                                                                    {m.file_name || 'Document'}
                                                                                </div>
                                                                                <div className={`text-[10px] mt-0.5 ${isMe ? 'text-white/70' : 'text-gray-500'
                                                                                    }`}>
                                                                                    {m.file_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                                                                                </div>
                                                                            </div>

                                                                            {/* Download Button */}
                                                                            <a
                                                                                href={getFileUrl(m.file_url)}
                                                                                download
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isMe
                                                                                    ? 'bg-white/20 hover:bg-white/30 text-white'
                                                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                                                                    }`}
                                                                                title="Download"
                                                                            >
                                                                                <FaDownload size={12} />
                                                                            </a>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            <div className="flex items-center justify-end gap-1 mt-1">
                                                                <div className={`text-[8px] ${isMe ? "text-red-100" : "text-gray-400"}`}>
                                                                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                                {isMe && m.seen && (
                                                                    <div className="text-[8px] text-red-100 font-bold">
                                                                        • Seen
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Input */}
                                    <form onSubmit={handleSend} className="p-2.5 sm:p-3 border-t shrink-0 flex flex-col gap-2 bg-white">
                                        {/* File / Recording Preview */}
                                        {selectedFile && (
                                            <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-2xl border border-gray-200 animate-in slide-in-from-bottom-2 shadow-sm">
                                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                    {audioBlob ? (
                                                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                                            <FaMicrophone className="text-red-600 animate-pulse" size={18} />
                                                        </div>
                                                    ) : filePreview ? (
                                                        <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                                                            <img src={filePreview} width="40" height="40" decoding="async" className="w-full h-full object-cover" alt="" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                                            <FaFileAlt className="text-blue-600" size={18} />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-bold text-gray-900 truncate">
                                                            {audioBlob ? "Voice Note Ready" : selectedFile.name}
                                                        </div>
                                                        <div className="text-[10px] text-gray-500 mt-0.5">
                                                            {audioBlob ? 'Audio Message' : selectedFile.type?.split('/')[1]?.toUpperCase() || 'FILE'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={clearFile}
                                                    className="ml-2 w-8 h-8 rounded-full bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors shadow-sm"
                                                    title="Remove"
                                                    aria-label="Remove selected file"
                                                >
                                                    <FaTimes size={14} />
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex gap-1.5 sm:gap-2 items-center min-w-0">
                                            {isRecording ? (
                                                <div className="flex-1 flex items-center gap-3 bg-red-50 p-3 rounded-2xl border-2 border-red-300 animate-in slide-in-from-bottom-2">
                                                    {/* Animated Recording Indicator */}
                                                    <div className="relative flex items-center justify-center">
                                                        <div className="absolute w-6 h-6 bg-red-500 rounded-full animate-ping opacity-75" />
                                                        <div className="relative w-4 h-4 bg-red-600 rounded-full" />
                                                    </div>

                                                    {/* Waveform Animation */}
                                                    <div className="flex items-center gap-[2px] h-6">
                                                        {[...Array(20)].map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className="w-[2px] bg-red-500 rounded-full animate-pulse"
                                                                style={{
                                                                    height: `${20 + Math.random() * 80}%`,
                                                                    animationDelay: `${i * 50}ms`,
                                                                    animationDuration: '0.8s'
                                                                }}
                                                            />
                                                        ))}
                                                    </div>

                                                    {/* Timer */}
                                                    <span className="text-red-600 font-bold text-sm tabular-nums">{formatTime(recordingTime)}</span>

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-2 ml-auto">
                                                        <button
                                                            type="button"
                                                            onClick={discardRecording}
                                                            className="text-gray-400 hover:text-red-600 p-2 transition-colors"
                                                            title="Discard"
                                                            aria-label="Discard recording"
                                                        >
                                                            <FaTrash size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={stopRecording}
                                                            className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg"
                                                            title="Stop Recording"
                                                            aria-label="Stop recording"
                                                        >
                                                            <FaStop size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="text-gray-400 hover:text-customRed p-1.5 sm:p-2 transition-colors shrink-0"
                                                        title="Attach File"
                                                        aria-label="Attach file"
                                                    >
                                                        <FaPaperclip size={18} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={startRecording}
                                                        className="text-gray-400 hover:text-customRed p-1.5 sm:p-2 transition-colors shrink-0"
                                                        title="Record Voice Note"
                                                        aria-label="Record voice note"
                                                    >
                                                        <FaMicrophone size={18} />
                                                    </button>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        onChange={handleFileChange}
                                                        className="hidden"
                                                    />
                                                    <input
                                                        value={text}
                                                        onChange={(e) => setText(e.target.value)}
                                                        placeholder="Type a message..."
                                                        autoComplete="off"
                                                        className="flex-1 min-w-0 text-xs border rounded-full px-3 sm:px-4 py-2 focus:outline-none focus:ring-1 focus:ring-customRed"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={(!text.trim() && !selectedFile) || isSending}
                                                        className="bg-customRed text-white p-2 rounded-full hover:scale-105 disabled:opacity-50 transition-all shadow-md flex items-center justify-center w-8 h-8 shrink-0"
                                                        aria-label="Send message"
                                                    >
                                                        <FaPaperPlane className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </form>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Calendar, User, Megaphone, Smile } from "lucide-react";
import { listNews, createNews, updateNews, deleteNews, toggleReaction, listReactions } from "./newsService";
import { BASE_URL } from "../../utils/api";
import socket from "../../utils/socket";
import NewsModal from "./components/NewsModal";
import NewsCommentSection from "./components/NewsCommentSection";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { ALL_EMOJIS, EMOJI_CATEGORIES } from "./utils/emojiData";

export default function NewsPage() {
    const { user } = useAuth();
    const [newsList, setNewsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [activeEmojiPicker, setActiveEmojiPicker] = useState(null); // newsId
    const [emojiSearch, setEmojiSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("smileys");

    const canPublish = (user?.features || []).some(f => ['news_create', 'news_publish', 'news_manage'].includes(f.toLowerCase()));

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await listNews();
            setNewsList(data);
        } catch (err) {
            toast.error("Failed to load news");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Reactions Real-time Sync via WebSockets
    useEffect(() => {
        const fetchLatestReactions = async () => {
            try {
                const reactionsMap = await listReactions();
                setNewsList(prev => prev.map(item => ({
                    ...item,
                    reactions: reactionsMap[item.id] || []
                })));
            } catch (err) {
                console.error("Failed to sync reactions", err);
            }
        };

        socket.on("news_reaction_updated", () => {
            fetchLatestReactions();
        });

        // Initial sync
        fetchLatestReactions();

        return () => {
            socket.off("news_reaction_updated");
        };
    }, []);

    const handleSave = async (formData) => {
        try {
            if (editingItem) {
                await updateNews(editingItem.id, formData);
                toast.success("News updated");
            } else {
                await createNews(formData);
                toast.success("News published successfully!");
            }
            loadData();
        } catch (err) {
            toast.error("Failed to save news");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this news?")) return;
        try {
            await deleteNews(id);
            toast.success("News deleted");
            loadData();
        } catch (err) {
            toast.error("Failed to delete news");
        }
    };


    const handleToggleReaction = async (newsId, emoji) => {
        try {
            // Optimistic update
            setNewsList(prev => prev.map(item => {
                if (item.id === newsId) {
                    const reactions = [...(item.reactions || [])];
                    const existingIdx = reactions.findIndex(r => r.emoji === emoji);

                    if (existingIdx !== -1) {
                        const r = reactions[existingIdx];
                        if (r.me) {
                            // Removing my reaction
                            r.count--;
                            r.me = false;
                            if (r.count <= 0) reactions.splice(existingIdx, 1);
                        } else {
                            // Adding my reaction
                            r.count++;
                            r.me = true;
                        }
                    } else {
                        // Brand new emoji
                        reactions.push({ emoji, count: 1, me: true });
                    }
                    return { ...item, reactions };
                }
                return item;
            }));

            await toggleReaction(newsId, emoji);
        } catch (err) {
            toast.error("Failed to react to news");
            loadData(); // Revert on error
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Megaphone className="text-customRed" />
                        News & Notifications
                    </h1>
                    <p className="text-gray-500 text-sm">Stay updated with the latest company announcements.</p>
                </div>

                {canPublish && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={() => {
                                setEditingItem(null);
                                setModalOpen(true);
                            }}
                            className="btn-primary h-11 px-8 shadow-red-500/20"
                        >
                            <Plus size={18} className="mr-2" />
                            Post News
                        </button>
                    </div>
                )}
            </div>


            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-customRed border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 font-medium">Loading announcements...</p>
                </div>
            ) : newsList.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed">
                    <Megaphone size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium text-lg">No news found.</p>
                    <p className="text-gray-400 text-sm">Check back later for updates.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {newsList.map((item) => (
                        <div
                            key={item.id}
                            className="group bg-white rounded-2xl shadow-sm border hover:shadow-md transition-all duration-300"
                        >
                            <div className="p-5 sm:p-6">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-customRed transition-colors mb-2">
                                            {item.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-4 text-[11px] sm:text-xs text-gray-500 uppercase tracking-widest font-semibold">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-gray-400" />
                                                {new Date(item.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <User size={14} className="text-gray-400" />
                                                {item.author_name}
                                            </span>
                                            {!item.is_published && (
                                                <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                    Draft
                                                </span>
                                            )}
                                            {item.post_type === 'image' && (
                                                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                                                    Image Post
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {canPublish && (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditingItem(item);
                                                    setModalOpen(true);
                                                }}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {item.image_url && (
                                    <div className="mb-4">
                                        <img
                                            src={`${BASE_URL}${item.image_url}`}
                                            alt={item.title}
                                            className="w-full h-64 object-cover rounded-lg"
                                        />
                                    </div>
                                )}

                                <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap mb-6">
                                    {item.content}
                                </div>

                                {/* Reaction Bar */}
                                <div className="pt-4 border-t border-slate-50 flex flex-wrap items-center gap-2">
                                    {['❤️', '👍', '😂', '🎉', '😮'].map(emoji => {
                                        const reaction = (item.reactions || []).find(r => r.emoji === emoji);
                                        const hasReacted = reaction?.me;
                                        const count = reaction?.count || 0;

                                        return (
                                            <button
                                                key={emoji}
                                                onClick={() => handleToggleReaction(item.id, emoji)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300
                                                    ${hasReacted
                                                        ? 'bg-customRed/10 text-customRed border-customRed/20 shadow-sm'
                                                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border-transparent'} border`}
                                            >
                                                <span className={`${hasReacted ? 'scale-110' : 'grayscale group-hover:grayscale-0'} transition-all`}>{emoji}</span>
                                                {count > 0 && <span>{count}</span>}
                                            </button>
                                        );
                                    })}

                                    {/* Dynamic Reactions (those not in the quick list but present in data) */}
                                    {(item.reactions || [])
                                        .filter(r => !['❤️', '👍', '😂', '🎉', '😮'].includes(r.emoji))
                                        .map(r => (
                                            <button
                                                key={r.emoji}
                                                onClick={() => handleToggleReaction(item.id, r.emoji)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300
                                                    ${r.me
                                                        ? 'bg-customRed/10 text-customRed border-customRed/20 shadow-sm'
                                                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border-transparent'} border`}
                                            >
                                                <span className={`${r.me ? 'scale-110' : ''} transition-all`}>{r.emoji}</span>
                                                {r.count > 0 && <span>{r.count}</span>}
                                            </button>
                                        ))}

                                    {/* More Emojis Button */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setActiveEmojiPicker(activeEmojiPicker === item.id ? null : item.id)}
                                            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 border
                                                ${activeEmojiPicker === item.id
                                                    ? 'bg-customRed/10 text-customRed border-customRed/20'
                                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border-transparent'}`}
                                            title="Add Reaction"
                                        >
                                            <Smile size={16} />
                                        </button>

                                        {activeEmojiPicker === item.id && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setActiveEmojiPicker(null)}
                                                />
                                                <div className="absolute bottom-full left-0 mb-2 p-3 bg-white rounded-2xl shadow-2xl border border-slate-100 z-20 w-72 animate-in slide-in-from-bottom-2 duration-200">
                                                    {/* Category Navigation */}
                                                    {!emojiSearch && (
                                                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-50 overflow-x-auto no-scrollbar gap-1">
                                                            {EMOJI_CATEGORIES.map(cat => (
                                                                <button
                                                                    key={cat.id}
                                                                    onClick={() => setActiveCategory(cat.id)}
                                                                    className={`flex-shrink-0 w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all
                                                                        ${activeCategory === cat.id ? 'bg-customRed/10 scale-110 shadow-sm' : 'hover:bg-slate-50 grayscale'}`}
                                                                    title={cat.label}
                                                                >
                                                                    {cat.icon}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Emoji Search Bar */}
                                                    <div className="mb-3">
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            placeholder="Search all emojis..."
                                                            value={emojiSearch}
                                                            onChange={(e) => setEmojiSearch(e.target.value)}
                                                            className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-customRed/30 transition-all font-medium"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-6 gap-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                                                        {ALL_EMOJIS
                                                            .filter(e => {
                                                                const query = emojiSearch.toLowerCase();
                                                                if (!query) return e.category === activeCategory;
                                                                return e.char.includes(query) || e.keywords.includes(query);
                                                            })
                                                            .map(emojiObj => {
                                                                const emoji = emojiObj.char;
                                                                const reaction = (item.reactions || []).find(r => r.emoji === emoji);
                                                                const hasReacted = reaction?.me;

                                                                return (
                                                                    <button
                                                                        key={emoji}
                                                                        onClick={() => {
                                                                            handleToggleReaction(item.id, emoji);
                                                                            setActiveEmojiPicker(null);
                                                                            setEmojiSearch("");
                                                                        }}
                                                                        className={`flex items-center justify-center w-9 h-9 rounded-lg text-xl hover:bg-slate-50 transition-all
                                                                            ${hasReacted ? 'bg-customRed/10 scale-110 shadow-sm' : ''}`}
                                                                        title={emojiObj.keywords.split(' ')[0]}
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                );
                                                            })}
                                                        {ALL_EMOJIS.filter(e => {
                                                            const query = emojiSearch.toLowerCase();
                                                            if (!query) return e.category === activeCategory;
                                                            return e.char.includes(query) || e.keywords.includes(query);
                                                        }).length === 0 && (
                                                                <div className="col-span-12 text-center py-6 text-xs text-slate-400 font-medium italic">
                                                                    No emoji found
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Comments Section */}
                                <NewsCommentSection newsId={item.id} currentUser={user} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <NewsModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
                initialData={editingItem}
            />
        </div>
    );
}

import React, { useState, useEffect, useCallback } from "react";
import { Send, Trash2, MessageCircle, User } from "lucide-react";
import { listComments, addComment, deleteComment } from "../newsService";
import { BASE_URL } from "../../../utils/api";
import socket from "../../../utils/socket";
import { toast } from "react-toastify";

export default function NewsCommentSection({ newsId, currentUser }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchComments = useCallback(async () => {
        try {
            setLoading(true);
            const data = await listComments(newsId);
            setComments(data);
        } catch (err) {
            console.error("Failed to load comments", err);
        } finally {
            setLoading(false);
        }
    }, [newsId]);

    useEffect(() => {
        fetchComments();

        const handleUpdate = (data) => {
            if (data.newsId === newsId) {
                fetchComments();
            }
        };

        socket.on("news_comment_updated", handleUpdate);
        return () => {
            socket.off("news_comment_updated", handleUpdate);
        };
    }, [newsId, fetchComments]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            setSubmitting(true);
            await addComment(newsId, newComment);
            setNewComment("");
            toast.success("Comment added");
            fetchComments();
        } catch (err) {
            toast.error("Failed to add comment");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            await deleteComment(commentId);
            toast.success("Comment deleted");
            fetchComments();
        } catch (err) {
            toast.error("Failed to delete comment");
        }
    };

    const getAvatarUrl = (imgPath) => {
        if (!imgPath) return null;
        if (imgPath.startsWith("http")) return imgPath;
        const cleanPath = imgPath.startsWith("/") ? imgPath : `/${imgPath}`;
        return `${BASE_URL}${cleanPath}`;
    };

    const isAdmin = (currentUser?.features || []).some(f => ['news_manage', 'news_delete'].includes(f.toLowerCase()));

    return (
        <div className="mt-6 border-t border-slate-50 pt-6">
            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4 uppercase tracking-wider">
                <MessageCircle size={16} className="text-customRed" />
                Comments ({comments.length})
            </h4>

            {/* Comment List */}
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                {loading && comments.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 text-xs italic">Loading comments...</div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 rounded-xl text-gray-400 text-xs italic border border-dashed">
                        No comments yet. Be the first to join the conversation!
                    </div>
                ) : (
                    comments.map((c) => (
                        <div key={c.id} className="flex gap-3 animate-in slide-in-from-left-2 duration-300">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200 shadow-sm">
                                {c.profile_img ? (
                                    <img src={getAvatarUrl(c.profile_img)} alt={c.author_name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <User size={14} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="bg-slate-50 rounded-2xl px-4 py-2 relative group">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <span className="text-[12px] font-bold text-gray-800">{c.author_name}</span>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {new Date(c.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{c.comment}</p>

                                    {(c.user_id === currentUser?.id || isAdmin) && (
                                        <button
                                            onClick={() => handleDelete(c.id)}
                                            className="absolute -right-2 -top-2 w-6 h-6 bg-white shadow-md rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 border border-slate-100"
                                            title="Delete Comment"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="relative group">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    disabled={submitting}
                    className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-customRed/20 transition-all shadow-sm group-hover:shadow-md font-medium"
                />
                <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all
                        ${newComment.trim() ? "bg-customRed text-white shadow-lg shadow-red-500/20 active:scale-95" : "text-slate-300 pointer-events-none"}`}
                >
                    <Send size={14} />
                </button>
            </form>
        </div>
    );
}

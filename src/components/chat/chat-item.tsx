"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FileIcon } from "lucide-react";
import axios from "axios";

interface ChatItemProps {
    id: string;
    content: string;
    memberId: string;
    member: any; // Can be Member (with nested profile) or User (direct)
    createdAt: string;
    deleted: boolean;
    fileUrl: string | null;
    currentMemberId: string;
    currentMemberRole: string;
    socketUrl: string;
    socketQuery: Record<string, string>;
    showAvatar: boolean;
}

export const ChatItem = ({
    id,
    content,
    memberId,
    member,
    createdAt,
    deleted,
    fileUrl,
    currentMemberId,
    currentMemberRole,
    socketUrl,
    socketQuery,
    showAvatar
}: ChatItemProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(content);
    const [isLoading, setIsLoading] = useState(false);

    const profile = member.profile || member;
    const isOwn = memberId === currentMemberId;
    const isAdmin = member.role === "ADMIN";
    const isModerator = member.role === "MODERATOR";
    const canDelete = isOwn || currentMemberRole === "ADMIN" || currentMemberRole === "MODERATOR";

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    };

    const renderContent = (text: string) => {
        // Simple regex to match @ followed by contiguous word characters or hyphens/underscores.
        const parts = text.split(/(@[\w\-_]+)/g);

        return parts.map((part, i) => {
            if (part.startsWith("@")) {
                return (
                    <span key={i} className="bg-indigo-500/20 text-indigo-400 font-medium rounded px-1 -mx-0.5 cursor-pointer hover:underline">
                        {part}
                    </span>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    const onDelete = async () => {
        try {
            setIsLoading(true);
            const qs = new URLSearchParams(socketQuery as Record<string, string>).toString();
            await axios.delete(`${socketUrl}/${id}?${qs}`);
        } catch (e) {
            console.error("Delete failed:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const onEdit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!editContent.trim()) {
            if (!fileUrl) onDelete(); // Delete if empty text and no file
            return;
        }
        try {
            setIsLoading(true);
            const qs = new URLSearchParams(socketQuery as Record<string, string>).toString();
            await axios.patch(`${socketUrl}/${id}?${qs}`, { content: editContent });
            setIsEditing(false);
        } catch (e) {
            console.error("Edit failed:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsEditing(false);
                setEditContent(content);
            }
        };
        if (isEditing) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isEditing, content]);

    return (
        <div className={`group flex items-start gap-3 hover:bg-zinc-800/30 px-2 rounded transition ${showAvatar ? "pt-3" : "pt-0.5"}`}>
            {showAvatar ? (
                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5">
                    {profile.name?.[0]?.toUpperCase() || "?"}
                </div>
            ) : (
                <div className="w-10 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
                {showAvatar && (
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm font-semibold ${isAdmin ? "text-yellow-400" : isModerator ? "text-indigo-400" : "text-white"}`}>
                            {profile.name}
                        </span>
                        {isAdmin && <span className="text-[10px]">👑</span>}
                        {isModerator && <span className="text-[10px]">🛡️</span>}
                        <span className="text-[10px] text-zinc-500">
                            {formatDate(createdAt)} {formatTime(createdAt)}
                        </span>
                    </div>
                )}

                {/* Attachment Rendering */}
                {!deleted && fileUrl && (
                    <div className="mb-2 mt-1">
                        {fileUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i) || content === fileUrl ? (
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative aspect-auto flex max-w-sm mt-2 overflow-hidden rounded-md cursor-pointer border border-[#1e1f22]"
                            >
                                <Image
                                    src={fileUrl}
                                    alt="content"
                                    width={300}
                                    height={300}
                                    className="object-cover"
                                />
                            </a>
                        ) : (
                            <div className="relative flex items-center p-3 mt-2 rounded-md bg-[#2b2d31]">
                                <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-sm text-indigo-400 hover:underline"
                                >
                                    PDF Attachment
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {/* Text Content / Edit Form */}
                {!fileUrl || content !== fileUrl ? (
                    isEditing ? (
                        <form onSubmit={onEdit} className="mt-1 flex items-center gap-2 w-full">
                            <input
                                autoFocus
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                disabled={isLoading}
                                className="flex-1 bg-[#383a40] text-zinc-200 p-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-xl"
                            />
                            <button type="button" onClick={() => { setIsEditing(false); setEditContent(content); }} className="text-xs text-zinc-400 hover:underline">
                                escape to cancel
                            </button>
                            <span className="text-xs text-zinc-500">•</span>
                            <button type="submit" disabled={isLoading} className="text-xs text-indigo-400 hover:underline">
                                enter to save
                            </button>
                        </form>
                    ) : (
                        <p className={`text-sm ${deleted ? "italic text-zinc-500 text-xs" : "text-zinc-300"} whitespace-pre-wrap`}>
                            {deleted ? "This message has been deleted." : renderContent(content)}
                        </p>
                    )
                ) : null}
            </div>

            {/* Action buttons */}
            {!deleted && canDelete && !isEditing && (
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition">
                    {isOwn && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-1 text-zinc-500 hover:text-zinc-300 transition"
                            title="Edit"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    )}
                    <button
                        onClick={onDelete}
                        className="p-1 text-zinc-500 hover:text-red-400 transition"
                        title="Delete"
                        disabled={isLoading}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};

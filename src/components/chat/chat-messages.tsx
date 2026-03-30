"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import axios from "axios";
import Image from "next/image";
import { FileIcon } from "lucide-react";

interface Message {
    id: string;
    content: string;
    fileUrl: string | null;
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
    memberId: string;
    member: {
        id: string;
        role: string;
        profile: {
            id: string;
            name: string;
            imageUrl: string;
        };
    };
}

interface ChatMessagesProps {
    channelId: string;
    serverId: string;
    channelName: string;
    currentMemberId: string;
    currentMemberRole: string;
}

export const ChatMessages = ({
    channelId,
    serverId,
    channelName,
    currentMemberId,
    currentMemberRole,
}: ChatMessagesProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [cursor, setCursor] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const { socket } = useSocket();
    const bottomRef = useRef<HTMLDivElement>(null);
    const topRef = useRef<HTMLDivElement>(null);

    // Fetch messages
    const fetchMessages = useCallback(async (cursorId?: string | null) => {
        try {
            const url = cursorId
                ? `/api/messages?channelId=${channelId}&cursor=${cursorId}`
                : `/api/messages?channelId=${channelId}`;

            const res = await axios.get(url);
            const data = res.data;

            if (cursorId) {
                setMessages((prev) => [...prev, ...data.items]);
            } else {
                setMessages(data.items);
            }

            setHasNextPage(!!data.nextCursor);
            setCursor(data.nextCursor);
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        }
    }, [channelId]);

    // Initial load
    useEffect(() => {
        setIsInitialLoading(true);
        setMessages([]);
        setCursor(null);
        setHasNextPage(true);
        fetchMessages(null).finally(() => setIsInitialLoading(false));
    }, [channelId, fetchMessages]);

    // Real-time: listen for new messages
    useEffect(() => {
        if (!socket) return;

        const channelKey = `chat:${channelId}:messages`;

        socket.on(channelKey, (message: Message) => {
            setMessages((prev) => [message, ...prev]);
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        });

        const updateKey = `chat:${channelId}:messages:update`;
        socket.on(updateKey, (updatedMessage: Message) => {
            setMessages((prev) =>
                prev.map((msg) => msg.id === updatedMessage.id ? updatedMessage : msg)
            );
        });

        return () => {
            socket.off(channelKey);
            socket.off(updateKey);
        };
    }, [socket, channelId]);

    // Scroll to bottom on initial load
    useEffect(() => {
        if (!isInitialLoading && messages.length > 0) {
            bottomRef.current?.scrollIntoView();
        }
    }, [isInitialLoading]);

    // Load more (infinite scroll up)
    const loadMore = async () => {
        if (!hasNextPage || isLoadingMore) return;
        setIsLoadingMore(true);
        await fetchMessages(cursor);
        setIsLoadingMore(false);
    };

    // Intersection observer for scroll-to-top loading
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isLoadingMore) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (topRef.current) {
            observer.observe(topRef.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isLoadingMore, cursor]);

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    };

    if (isInitialLoading) {
        return (
            <div className="flex flex-col flex-1 justify-center items-center">
                <svg className="animate-spin h-7 w-7 text-zinc-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-zinc-500 text-xs mt-2">Loading messages...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 overflow-y-auto">
            {/* Infinite scroll sentinel */}
            {hasNextPage && (
                <div ref={topRef} className="flex justify-center py-2">
                    {isLoadingMore && (
                        <svg className="animate-spin h-5 w-5 text-zinc-500" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    )}
                </div>
            )}

            {/* Welcome message if no messages */}
            {messages.length === 0 && !hasNextPage && (
                <div className="flex flex-col items-start p-4 mt-auto">
                    <div className="w-16 h-16 rounded-full bg-[#5865f2] flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                    </div>
                    <h3 className="text-3xl text-white font-bold mb-2">
                        Welcome to #{channelName}!
                    </h3>
                    <p className="text-zinc-400 text-sm">
                        This is the start of the #{channelName} channel.
                    </p>
                </div>
            )}

            {/* Messages (reversed because newest first from API) */}
            <div className="flex flex-col-reverse p-4 gap-1">
                <div ref={bottomRef} />
                {messages.map((message, i) => {
                    const isOwn = message.memberId === currentMemberId;
                    const isAdmin = message.member.role === "ADMIN";
                    const isModerator = message.member.role === "MODERATOR";
                    const isDeleted = message.deleted;
                    const canDelete = isOwn || currentMemberRole === "ADMIN" || currentMemberRole === "MODERATOR";

                    // Group messages from same user
                    const prevMsg = messages[i + 1];
                    const showAvatar = !prevMsg || prevMsg.memberId !== message.memberId ||
                        new Date(message.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 5 * 60 * 1000;

                    return (
                        <div
                            key={message.id}
                            className={`group flex items-start gap-3 hover:bg-zinc-800/30 px-2 rounded transition ${showAvatar ? "pt-3" : "pt-0.5"
                                }`}
                        >
                            {showAvatar ? (
                                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5">
                                    {message.member.profile.name[0]?.toUpperCase()}
                                </div>
                            ) : (
                                <div className="w-10 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                                {showAvatar && (
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={`text-sm font-semibold ${isAdmin ? "text-yellow-400" :
                                            isModerator ? "text-indigo-400" : "text-white"
                                            }`}>
                                            {message.member.profile.name}
                                        </span>
                                        {isAdmin && <span className="text-[10px]">👑</span>}
                                        {isModerator && <span className="text-[10px]">🛡️</span>}
                                        <span className="text-[10px] text-zinc-500">
                                            {formatDate(message.createdAt)} {formatTime(message.createdAt)}
                                        </span>
                                    </div>
                                )}
                                {/* Attachment Rendering */}
                                {!isDeleted && message.fileUrl && (
                                    <div className="mb-2 mt-1">
                                        {message.fileUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i) || message.content === message.fileUrl ? (
                                            <a
                                                href={message.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="relative aspect-auto flex max-w-sm mt-2 overflow-hidden rounded-md cursor-pointer border border-[#1e1f22]"
                                            >
                                                <Image
                                                    src={message.fileUrl}
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
                                                    href={message.fileUrl}
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
                                {/* Text Content */}
                                {(!message.fileUrl || message.content !== message.fileUrl) && (
                                    <p className={`text-sm ${isDeleted
                                        ? "italic text-zinc-500 text-xs"
                                        : "text-zinc-300"
                                        }`}>
                                        {isDeleted ? "This message has been deleted." : message.content}
                                    </p>
                                )}
                            </div>
                            {/* Action buttons */}
                            {!isDeleted && canDelete && (
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition">
                                    {isOwn && (
                                        <button
                                            className="p-1 text-zinc-500 hover:text-zinc-300 transition"
                                            title="Edit"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                    )}
                                    <button
                                        className="p-1 text-zinc-500 hover:text-red-400 transition"
                                        title="Delete"
                                        onClick={async () => {
                                            try {
                                                await axios.delete(`/api/messages/${message.id}?channelId=${channelId}&serverId=${serverId}`);
                                            } catch (e) {
                                                console.error("Delete failed:", e);
                                            }
                                        }}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

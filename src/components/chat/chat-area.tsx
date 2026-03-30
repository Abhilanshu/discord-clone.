"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import { ChatInput } from "./chat-input";
import axios from "axios";
import { ChatItem } from "./chat-item";

interface Message {
    id: string;
    content: string;
    fileUrl: string | null;
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
    memberId: string;
    member: any; // Can be Member (with nested profile) or User (direct)
}

interface ChatAreaProps {
    channelId?: string;
    serverId: string;
    channelName: string;
    currentMemberId: string;
    currentMemberRole: string;
    apiUrl: string;
    socketUrl: string;
    socketQuery: Record<string, string>;
    paramKey: "channelId" | "conversationId";
    paramValue: string;
    currentMemberName: string;
}

export const ChatArea = ({
    channelId,
    serverId,
    channelName,
    currentMemberId,
    currentMemberRole,
    apiUrl,
    socketUrl,
    socketQuery,
    paramKey,
    paramValue,
    currentMemberName,
}: ChatAreaProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [cursor, setCursor] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

    const { socket } = useSocket();
    const bottomRef = useRef<HTMLDivElement>(null);
    const topRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Fetch messages
    const fetchMessages = useCallback(async (cursorId?: string | null) => {
        try {
            const url = cursorId
                ? `${apiUrl}?${paramKey}=${paramValue}&cursor=${cursorId}`
                : `${apiUrl}?${paramKey}=${paramValue}`;

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

    // Refetch latest messages (after sending)
    const refetchLatest = useCallback(async () => {
        try {
            const res = await axios.get(`${apiUrl}?${paramKey}=${paramValue}`);
            const data = res.data;
            setMessages(data.items);
            setHasNextPage(!!data.nextCursor);
            setCursor(data.nextCursor);

            // Scroll to bottom
            setTimeout(() => {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        } catch (error) {
            console.error("Failed to refetch messages:", error);
        }
    }, [channelId]);

    // Initial load
    useEffect(() => {
        setIsInitialLoading(true);
        setMessages([]);
        setCursor(null);
        setHasNextPage(true);
        fetchMessages(null).finally(() => {
            setIsInitialLoading(false);
            setTimeout(() => {
                bottomRef.current?.scrollIntoView();
            }, 100);
        });
    }, [channelId, fetchMessages]);

    // Polling for new messages every 3 seconds (fallback for Socket.io)
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await axios.get(`${apiUrl}?${paramKey}=${paramValue}`);
                const data = res.data;

                // Only update if we have new messages
                if (data.items.length > 0) {
                    setMessages((prevMessages) => {
                        const existingIds = new Set(prevMessages.map(m => m.id));
                        const newMsgs = data.items.filter((m: Message) => !existingIds.has(m.id));

                        if (newMsgs.length > 0) {
                            // Check if user is near the bottom
                            const container = scrollContainerRef.current;
                            const isNearBottom = container
                                ? container.scrollHeight - container.scrollTop - container.clientHeight < 100
                                : true;

                            const merged = [...newMsgs, ...prevMessages];

                            if (isNearBottom) {
                                setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                            }

                            return merged;
                        }

                        // Also update any edited/deleted messages
                        return prevMessages.map(prevMsg => {
                            const updatedMsg = data.items.find((m: Message) => m.id === prevMsg.id);
                            if (updatedMsg && updatedMsg.updatedAt !== prevMsg.updatedAt) {
                                return updatedMsg;
                            }
                            return prevMsg;
                        });
                    });
                }
            } catch {
                // Silent fail for polling
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [channelId]);

    // Real-time Socket.io listeners
    useEffect(() => {
        if (!socket) return;

        const channelKey = `chat:${paramValue}:messages`;
        socket.on(channelKey, (message: Message) => {
            setMessages((prev) => [message, ...prev]);
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        });

        const updateKey = `chat:${paramValue}:messages:update`;
        socket.on(updateKey, (updatedMessage: Message) => {
            setMessages((prev) =>
                prev.map((msg) => msg.id === updatedMessage.id ? updatedMessage : msg)
            );
        });

        const typingKey = `typing:${paramValue}`;
        socket.on(typingKey, (data: { memberName: string }) => {
            if (data.memberName !== currentMemberName) {
                setTypingUsers((prev) => {
                    const next = new Set(prev);
                    next.add(data.memberName);
                    return next;
                });
            }
        });

        const stopTypingKey = `stopTyping:${paramValue}`;
        socket.on(stopTypingKey, (data: { memberName: string }) => {
            setTypingUsers((prev) => {
                const next = new Set(prev);
                next.delete(data.memberName);
                return next;
            });
        });

        return () => {
            socket.off(channelKey);
            socket.off(updateKey);
            socket.off(typingKey);
            socket.off(stopTypingKey);
        };
    }, [socket, paramValue, currentMemberName]);

    // Load more (infinite scroll up)
    const loadMore = async () => {
        if (!hasNextPage || isLoadingMore) return;
        setIsLoadingMore(true);
        await fetchMessages(cursor);
        setIsLoadingMore(false);
    };

    // Intersection observer for infinite scroll
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
            <>
                <div className="flex flex-col flex-1 justify-center items-center">
                    <svg className="animate-spin h-7 w-7 text-zinc-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-zinc-500 text-xs mt-2">Loading messages...</p>
                </div>
                <ChatInput
                    apiUrl={socketUrl}
                    query={socketQuery}
                    name={channelName}
                    currentMemberName={currentMemberName}
                    socketRoom={paramValue}
                    onMessageSent={refetchLatest}
                />
            </>
        );
    }

    return (
        <>
            <div ref={scrollContainerRef} className="flex flex-col flex-1 overflow-y-auto">
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
                            <ChatItem
                                key={message.id}
                                id={message.id}
                                currentMemberId={currentMemberId}
                                currentMemberRole={currentMemberRole}
                                memberId={message.memberId}
                                member={message.member}
                                content={message.content}
                                fileUrl={message.fileUrl}
                                deleted={message.deleted}
                                createdAt={message.createdAt}
                                socketUrl={socketUrl}
                                socketQuery={socketQuery as Record<string, string>}
                                showAvatar={showAvatar}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
                <div className="px-4 py-2 text-sm text-zinc-400 italic">
                    {Array.from(typingUsers).join(", ")} {typingUsers.size === 1 ? "is" : "are"} typing...
                </div>
            )}

            {/* Chat Input */}
            <ChatInput
                apiUrl={socketUrl}
                query={socketQuery}
                name={channelName}
                currentMemberName={currentMemberName}
                socketRoom={paramValue}
                onMessageSent={refetchLatest}
            />
        </>
    );
};

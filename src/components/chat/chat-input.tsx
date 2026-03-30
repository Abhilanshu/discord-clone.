"use client";

import { useState, FormEvent, useRef } from "react";
import axios from "axios";
import { useSocket } from "@/components/providers/socket-provider";

interface ChatInputProps {
    apiUrl: string;
    query: Record<string, any>;
    name: string;
    currentMemberName: string;
    socketRoom: string;
    onMessageSent?: () => void;
}

import { MessageFileModal } from "@/components/modals/message-file-modal";
import { EmojiPicker } from "./emoji-picker";

export const ChatInput = ({ apiUrl, query, name, currentMemberName, socketRoom, onMessageSent }: ChatInputProps) => {
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
    const { isConnected, socket } = useSocket();
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleKeyDown = () => {
        if (!socket || !isConnected) return;

        socket.emit("typing", { room: socketRoom, memberName: currentMemberName });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stopTyping", { room: socketRoom, memberName: currentMemberName });
        }, 1500);
    };

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!content.trim()) return;

        try {
            setIsLoading(true);
            const qs = new URLSearchParams(query as Record<string, string>).toString();
            await axios.post(
                `${apiUrl}?${qs}`,
                { content: content.trim() }
            );
            setContent("");
            onMessageSent?.();
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="px-4 pb-4">
            <form onSubmit={onSubmit}>
                <div className="bg-[#383a40] rounded-lg px-4 py-3 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsFileDialogOpen(true)}
                        className="text-zinc-400 hover:text-zinc-200 transition"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                    <input
                        type="text"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message ${name}`}
                        disabled={isLoading}
                        className="flex-1 bg-transparent text-zinc-200 text-sm placeholder:text-zinc-500 focus:outline-none disabled:opacity-50"
                    />
                    <div className="flex items-center gap-2">
                        {/* Connection indicator */}
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-yellow-500'}`}
                            title={isConnected ? 'Connected (real-time)' : 'Polling mode'}
                        />
                        <EmojiPicker
                            onChange={(emoji: string) => setContent((prev) => prev && prev + emoji || emoji)}
                        />
                    </div>
                </div>
            </form>

            <MessageFileModal
                apiUrl={apiUrl}
                query={query}
                isOpen={isFileDialogOpen}
                onClose={() => setIsFileDialogOpen(false)}
            />
        </div>
    );
};

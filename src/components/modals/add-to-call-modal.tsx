"use client";

import { useState, useEffect } from "react";
import { X, Phone, UserPlus, Search, Loader2 } from "lucide-react";
import { useCallStore } from "@/hooks/use-call-store";
import axios from "axios";

interface Friend {
    id: string;
    profileId: string;
    name: string;
    imageUrl: string;
}

interface AddToCallModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentChatId: string;
    conversationId: string;
}

export const AddToCallModal = ({ isOpen, onClose, currentChatId, conversationId }: AddToCallModalProps) => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [invitingId, setInvitingId] = useState<string | null>(null);
    const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
    const { activeCall } = useCallStore();

    useEffect(() => {
        if (!isOpen) return;

        const fetchFriends = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get("/api/friends");
                setFriends(response.data.filter((f: any) => f.status === "Online" || f.status === "Offline"));
            } catch (error) {
                console.error("Failed to fetch friends:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFriends();
    }, [isOpen]);

    const inviteFriend = async (friend: Friend) => {
        try {
            setInvitingId(friend.profileId);
            // Send a call notification to this friend with the same chatId (LiveKit room)
            await axios.post("/api/calls", {
                receiverProfileId: friend.profileId,
                conversationId: conversationId,
                chatId: currentChatId,
                type: activeCall?.type || "audio",
            });
            setInvitedIds(prev => new Set(prev).add(friend.profileId));
        } catch (error) {
            console.error("Failed to invite friend:", error);
        } finally {
            setInvitingId(null);
        }
    };

    const filteredFriends = friends.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
            <div className="w-full max-w-md bg-[#313338] rounded-xl shadow-2xl border border-zinc-700/50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/50">
                    <div className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-indigo-400" />
                        <h2 className="text-white font-semibold">Add People to Call</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-4 py-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search friends..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#1E1F22] text-zinc-200 rounded-md py-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-zinc-500 text-sm"
                        />
                        <Search className="absolute right-3 top-2.5 h-4 w-4 text-zinc-500" />
                    </div>
                </div>

                {/* Friends List */}
                <div className="max-h-72 overflow-y-auto px-2 pb-3">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                        </div>
                    ) : filteredFriends.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500 text-sm">
                            {search ? "No friends match your search" : "No friends available"}
                        </div>
                    ) : (
                        filteredFriends.map((friend) => (
                            <div
                                key={friend.profileId}
                                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-700/30 transition"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                        {friend.name[0]?.toUpperCase()}
                                    </div>
                                    <span className="text-zinc-200 font-medium text-sm">
                                        {friend.name}
                                    </span>
                                </div>

                                {invitedIds.has(friend.profileId) ? (
                                    <span className="text-xs text-emerald-400 font-semibold px-3 py-1.5 bg-emerald-500/10 rounded-md">
                                        Invited ✓
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => inviteFriend(friend)}
                                        disabled={invitingId === friend.profileId}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-semibold rounded-md transition"
                                    >
                                        {invitingId === friend.profileId ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Phone className="h-3 w-3" />
                                        )}
                                        Invite
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

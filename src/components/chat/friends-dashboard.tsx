"use client";

import { useState, useMemo, useDeferredValue } from "react";
import { User, MessageSquare, MoreVertical, Search, Inbox, HelpCircle, Phone, Video, Check, X } from "lucide-react";
import Image from "next/image";
import { AddFriendModal } from "@/components/modals/add-friend-modal";
import { CallHistory } from "@/components/call-history";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useSocket } from "@/components/providers/socket-provider";

interface Friend {
    id: string;
    profileId: string;
    userId: string;
    name: string;
    imageUrl: string;
    status: "Online" | "Offline" | "Pending" | "Blocked";
    isIncoming?: boolean;
}

interface FriendsDashboardProps {
    profileId: string;
    initialFriends: Friend[];
}

export const FriendsDashboard = ({ profileId, initialFriends }: FriendsDashboardProps) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"Online" | "All" | "Pending" | "Blocked" | "Calls">("All");
    const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const deferredSearchQuery = useDeferredValue(searchQuery);
    const { onlineUsers } = useSocket();

    const filteredFriends = useMemo(() => {
        return initialFriends.map(f => ({
            ...f,
            status: (f.status === "Offline" && onlineUsers.includes(f.userId)) ? "Online" : f.status
        })).filter((friend) => {
            // Tab filtering
            if (activeTab === "Online" && friend.status !== "Online") return false;
            if (activeTab === "Pending" && friend.status !== "Pending") return false;
            if (activeTab === "Blocked" && friend.status !== "Blocked") return false;
            // "All" tab shows all accepted friends (Online + Offline), not pending/blocked
            if (activeTab === "All" && (friend.status === "Pending" || friend.status === "Blocked")) return false;

            // Search filtering
            if (deferredSearchQuery && !friend.name.toLowerCase().includes(deferredSearchQuery.toLowerCase())) return false;

            return true;
        });
    }, [initialFriends, activeTab, deferredSearchQuery, onlineUsers]);

    const onMessage = async (friendProfileId: string) => {
        try {
            const response = await axios.post("/api/conversations", {
                memberTwoId: friendProfileId
            });
            router.push(`/direct-messages/${response.data.id}`);
        } catch (error) {
            console.error("Failed to start conversation:", error);
        }
    };

    const onCall = async (friendProfileId: string, type: "audio" | "video") => {
        try {
            const response = await axios.post("/api/conversations", {
                memberTwoId: friendProfileId
            });
            router.push(`/direct-messages/${response.data.id}?callType=${type}`);
        } catch (error) {
            console.error("Failed to start call:", error);
        }
    };

    const onAccept = async (friendshipId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await axios.post("/api/friends/accept", { friendshipId });
            router.refresh();
        } catch (error) {
            console.error(error);
        }
    };

    const onDecline = async (friendshipId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await axios.post("/api/friends/decline", { friendshipId });
            router.refresh();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#313338]">
            {/* Top Navigation Bar */}
            <header className="h-12 border-b border-[#1E1F22] flex items-center px-4 shrink-0 shadow-sm justify-between bg-[#313338] z-10">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <User className="h-6 w-6" />
                        <span className="font-semibold text-white ml-2">Friends</span>
                    </div>

                    <div className="h-6 w-[1px] bg-zinc-700 mx-2"></div>

                    <div className="flex items-center gap-4 text-zinc-400 font-medium text-[15px]">
                        <button
                            onClick={() => setActiveTab("Online")}
                            className={`px-2 py-1 rounded transition ${activeTab === "Online" ? "text-white bg-zinc-700/50" : "hover:text-zinc-200 hover:bg-zinc-700/30"}`}
                        >
                            Online
                        </button>
                        <button
                            onClick={() => setActiveTab("All")}
                            className={`px-2 py-1 rounded transition ${activeTab === "All" ? "text-white bg-zinc-700/50" : "hover:text-zinc-200 hover:bg-zinc-700/30"}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setActiveTab("Pending")}
                            className={`px-2 py-1 rounded transition ${activeTab === "Pending" ? "text-white bg-zinc-700/50" : "hover:text-zinc-200 hover:bg-zinc-700/30"}`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setActiveTab("Blocked")}
                            className={`px-2 py-1 rounded transition ${activeTab === "Blocked" ? "text-white bg-zinc-700/50" : "hover:text-zinc-200 hover:bg-zinc-700/30"}`}
                        >
                            Blocked
                        </button>
                        <button
                            onClick={() => setActiveTab("Calls")}
                            className={`px-2 py-1 rounded transition ${activeTab === "Calls" ? "text-white bg-zinc-700/50" : "hover:text-zinc-200 hover:bg-zinc-700/30"}`}
                        >
                            Calls
                        </button>
                        <button
                            onClick={() => setIsAddFriendModalOpen(true)}
                            className="bg-[#248046] text-white px-2 py-1 rounded text-sm font-semibold hover:bg-[#1a6334] transition flex items-center gap-1 ml-2"
                        >
                            Add Friend
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-zinc-400">
                    <button className="hover:text-zinc-200 transition" title="New Group DM">
                        <MessageSquare className="h-5 w-5" />
                    </button>
                    <div className="h-6 w-[1px] bg-zinc-700"></div>
                    <button className="hover:text-zinc-200 transition" title="Inbox">
                        <Inbox className="h-5 w-5" />
                    </button>
                    <button className="hover:text-zinc-200 transition" title="Help">
                        <HelpCircle className="h-5 w-5" />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Friends List Column */}
                <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto scrollbar-hide">
                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#1E1F22] text-zinc-200 rounded-[4px] py-[6px] pl-3 pr-10 focus:outline-none placeholder:text-zinc-400 text-sm"
                        />
                        <Search className="absolute right-3 top-2.5 h-4 w-4 text-zinc-400" />
                    </div>

                    {activeTab === "Calls" ? (
                        <>
                            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-4">
                                RECENT CALLS
                            </h2>
                            <CallHistory />
                        </>
                    ) : (
                        <>
                            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-4">
                                {activeTab} — {filteredFriends.length}
                            </h2>

                            <div className="flex flex-col gap-[2px]">
                                {filteredFriends.map((friend) => (
                                    <div
                                        key={friend.id}
                                        className="group flex items-center justify-between p-3 rounded-lg hover:bg-zinc-700/40 transition cursor-pointer border-t border-transparent hover:border-[#1E1F22] hover:shadow-sm"
                                        onClick={() => onMessage(friend.profileId)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
                                                {friend.imageUrl ? (
                                                    <Image src={friend.imageUrl} alt={friend.name} fill className="rounded-full" />
                                                ) : (
                                                    <span className="text-white font-bold text-sm">{friend.name[0]?.toUpperCase()}</span>
                                                )}
                                                {friend.status === "Online" && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] bg-green-500 rounded-full border-[3px] border-[#313338]" />
                                                )}
                                                {friend.status === "Offline" && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] bg-zinc-500 rounded-full border-[3px] border-[#313338]" />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-zinc-100 font-semibold text-[15px] leading-tight flex items-center gap-1">
                                                    {friend.name}
                                                </span>
                                                <span className="text-xs text-zinc-400 mt-[2px]">
                                                    {friend.status === "Pending" ? (friend.isIncoming ? "Incoming friend request" : "Outgoing friend request") : friend.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Hover Actions — Message, Voice Call, Video Call */}
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {friend.status === "Pending" ? (
                                                <>
                                                    {friend.isIncoming && (
                                                        <div
                                                            onClick={(e) => onAccept(friend.id, e)}
                                                            className="bg-[#2B2D31] p-2 rounded-full hover:bg-green-600 hover:text-white text-zinc-300 transition"
                                                            title="Accept Request"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </div>
                                                    )}
                                                    <div
                                                        onClick={(e) => onDecline(friend.id, e)}
                                                        className="bg-[#2B2D31] p-2 rounded-full hover:bg-rose-500 hover:text-white text-zinc-300 transition"
                                                        title={friend.isIncoming ? "Decline" : "Cancel Request"}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div
                                                        onClick={(e) => { e.stopPropagation(); onMessage(friend.profileId); }}
                                                        className="bg-[#2B2D31] p-2 rounded-full hover:bg-zinc-700 text-zinc-300 transition"
                                                        title="Message"
                                                    >
                                                        <MessageSquare className="h-4 w-4" />
                                                    </div>
                                                    <div
                                                        onClick={(e) => { e.stopPropagation(); onCall(friend.profileId, "audio"); }}
                                                        className="bg-[#2B2D31] p-2 rounded-full hover:bg-zinc-700 text-zinc-300 transition"
                                                        title="Voice Call"
                                                    >
                                                        <Phone className="h-4 w-4" />
                                                    </div>
                                                    <div
                                                        onClick={(e) => { e.stopPropagation(); onCall(friend.profileId, "video"); }}
                                                        className="bg-[#2B2D31] p-2 rounded-full hover:bg-zinc-700 text-zinc-300 transition"
                                                        title="Video Call"
                                                    >
                                                        <Video className="h-4 w-4" />
                                                    </div>
                                                    <div
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="bg-[#2B2D31] p-2 rounded-full hover:bg-zinc-700 text-zinc-300 transition"
                                                        title="More"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {filteredFriends.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-64 text-center mt-12">
                                        <div className="w-[300px] h-[200px] bg-zinc-800/50 rounded-lg mb-8 flex items-center justify-center text-zinc-500 border border-zinc-700/30">
                                            [ Illustration ]
                                        </div>
                                        <p className="text-zinc-400">
                                            {activeTab === "All" ? "No friends yet. Click \"Add Friend\" to get started!" : `No one's around to play with Wumpus.`}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Vertical Divider */}
                <div className="w-[1px] bg-zinc-700/50 my-4" />

                {/* Active Now Sidebar */}
                <aside className="w-[360px] hidden xl:flex flex-col p-4 overflow-y-auto scrollbar-hide">
                    <h2 className="font-bold text-xl text-white mb-4">Active Now</h2>

                    <div className="bg-[#2B2D31] rounded-lg p-4 flex flex-col items-center text-center mt-2 border border-zinc-700/50">
                        <h3 className="text-white font-semibold mb-2">It&apos;s quiet for now...</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            When a friend starts an activity—like playing a game or hanging out on voice—we&apos;ll show it here!
                        </p>
                    </div>
                </aside>
            </div>

            <AddFriendModal
                profileId={profileId}
                isOpen={isAddFriendModalOpen}
                onClose={() => setIsAddFriendModalOpen(false)}
            />
        </div>
    );
};

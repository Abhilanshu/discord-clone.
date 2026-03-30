"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CreateChannelModal } from "@/components/modals/create-channel-modal";
import { EditChannelModal } from "@/components/modals/edit-channel-modal";
import { InviteModal } from "@/components/modals/invite-modal";
import { EditServerModal } from "@/components/modals/edit-server-modal";
import { UserArea } from "@/components/navigation/user-area";
import { useSocket } from "@/components/providers/socket-provider";
import { Plus, Settings } from "lucide-react";

interface Channel {
    id: string;
    name: string;
    type: "TEXT" | "AUDIO" | "VIDEO";
}

interface Member {
    id: string;
    role: string;
    profile: {
        id: string;
        userId: string;
        name: string;
        imageUrl: string;
    };
}

interface ServerSidebarProps {
    server: {
        id: string;
        name: string;
        imageUrl: string;
        inviteCode: string;
        channels: Channel[];
        members: Member[];
    };
    profileName: string;
    profileRole: string;
    profileImageUrl?: string;
}

export const ServerSidebar = ({ server, profileName, profileRole, profileImageUrl }: ServerSidebarProps) => {
    const router = useRouter();
    const params = useParams();
    const { onlineUsers, activeVoiceChannels } = useSocket();
    const [showCreateChannel, setShowCreateChannel] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [showEditServer, setShowEditServer] = useState(false);
    const [editChannel, setEditChannel] = useState<Channel | null>(null);

    const textChannels = server.channels.filter((ch) => ch.type === "TEXT");
    const audioChannels = server.channels.filter((ch) => ch.type === "AUDIO");
    const videoChannels = server.channels.filter((ch) => ch.type === "VIDEO");

    const canManageChannels = profileRole === "ADMIN" || profileRole === "MODERATOR";

    const navigateToChannel = (channelId: string) => {
        router.push(`/servers/${server.id}/channels/${channelId}`);
    };

    return (
        <>
            <div className="flex flex-col h-full bg-[#2B2D31]">
                <div className="flex items-center justify-between h-12 px-4 shadow-sm group">
                    <h2
                        className="text-white font-semibold truncate hover:text-zinc-300 cursor-pointer flex-1"
                        onClick={() => setShowInvite(true)}
                    >
                        {server.name}
                    </h2>
                    <div className="flex items-center gap-1">
                        {profileRole === "ADMIN" && (
                            <button
                                onClick={() => setShowEditServer(true)}
                                className="text-zinc-400 hover:text-white transition p-1"
                                title="Server Settings"
                            >
                                <Settings className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => setShowInvite(true)}
                            className="text-zinc-400 hover:text-white transition p-1"
                            title="Invite People"
                        >
                            <Plus className="w-5 h-5 text-indigo-400" />
                        </button>
                    </div>
                </div>

                {/* Channel List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {/* Text Channels */}
                    <div className="mb-2">
                        <div className="flex items-center justify-between px-2 mb-1">
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                                Text Channels
                            </p>
                            {canManageChannels && (
                                <button
                                    onClick={() => setShowCreateChannel(true)}
                                    className="text-zinc-500 hover:text-zinc-300 transition"
                                    title="Create Channel"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        {textChannels.map((channel) => {
                            const activeUsers = activeVoiceChannels.get(channel.id) || [];
                            return (
                                <div key={channel.id} className="flex flex-col mb-[2px]">
                                    <button
                                        onClick={() => navigateToChannel(channel.id)}
                                        className={`group w-full flex items-center gap-2 px-2 py-1.5 rounded-[4px] text-sm transition ${params?.channelId === channel.id
                                            ? "bg-zinc-700/60 text-white"
                                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50"
                                            }`}
                                    >
                                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                        </svg>
                                        <span className="truncate flex-1 text-left font-medium">{channel.name}</span>
                                        {channel.name !== "general" && canManageChannels && (
                                            <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center">
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    className="cursor-pointer outline-none"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditChannel(channel);
                                                    }}
                                                >
                                                    <Settings className="w-4 h-4 text-zinc-500 hover:text-zinc-300 transition" />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Voice Channels */}
                    <div className="mb-2">
                        <div className="flex items-center justify-between px-2 mb-1">
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                                Voice Channels
                            </p>
                            {canManageChannels && (
                                <button
                                    onClick={() => setShowCreateChannel(true)}
                                    className="text-zinc-500 hover:text-zinc-300 transition"
                                    title="Create Channel"
                                >
                                    <Plus className="w-4 h-4 text-zinc-500" />
                                </button>
                            )}
                        </div>
                        {audioChannels.map((channel) => {
                            const activeUsers = activeVoiceChannels.get(channel.id) || [];
                            return (
                                <div key={channel.id} className="flex flex-col mb-[2px]">
                                    <button
                                        onClick={() => navigateToChannel(channel.id)}
                                        className={`group w-full flex items-center gap-2 px-2 py-1.5 rounded-[4px] text-sm transition ${params?.channelId === channel.id
                                            ? "bg-zinc-700/60 text-white"
                                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50"
                                            }`}
                                    >
                                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-2.464a5 5 0 010-7.072" />
                                        </svg>
                                        <span className="truncate flex-1 text-left font-medium">{channel.name}</span>
                                        {canManageChannels && (
                                            <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center">
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    className="cursor-pointer outline-none"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditChannel(channel);
                                                    }}
                                                >
                                                    <Settings className="w-4 h-4 text-zinc-500 hover:text-zinc-300 transition" />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                    {/* Voice Preview Avatars */}
                                    {activeUsers.length > 0 && (
                                        <div className="flex flex-col pl-8 pr-2 pb-1 gap-1">
                                            {activeUsers.map((user: any) => (
                                                <div key={user.id} className="flex items-center gap-2 rounded px-2 mt-1 transition">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm ring-2 ring-[#2B2D31]">
                                                        {user.name && user.name.length > 0 ? user.name[0]?.toUpperCase() : "?"}
                                                    </div>
                                                    <span className="text-xs text-zinc-300 font-medium truncate">{user.name || "Unknown User"}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {videoChannels.map((channel) => {
                            const activeUsers = activeVoiceChannels.get(channel.id) || [];
                            return (
                                <div key={channel.id} className="flex flex-col mb-[2px]">
                                    <button
                                        onClick={() => navigateToChannel(channel.id)}
                                        className={`group w-full flex items-center gap-2 px-2 py-1.5 rounded-[4px] text-sm transition ${params?.channelId === channel.id
                                            ? "bg-zinc-700/60 text-white"
                                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50"
                                            }`}
                                    >
                                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        <span className="truncate flex-1 text-left font-medium">{channel.name}</span>
                                        {canManageChannels && (
                                            <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center">
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    className="cursor-pointer outline-none"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditChannel(channel);
                                                    }}
                                                >
                                                    <Settings className="w-4 h-4 text-zinc-500 hover:text-zinc-300 transition" />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                    {/* Video Preview Avatars */}
                                    {activeUsers.length > 0 && (
                                        <div className="flex flex-col pl-8 pr-2 pb-1 gap-1">
                                            {activeUsers.map((user: any) => (
                                                <div key={user.id} className="flex items-center gap-2 rounded px-2 mt-1 transition">
                                                    <div className="relative w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm ring-2 ring-[#2B2D31]">
                                                        {user.name && user.name.length > 0 ? user.name[0]?.toUpperCase() : "?"}
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] bg-red-500 rounded-full border-[2px] border-[#2b2d31] flex items-center justify-center">
                                                            <div className="w-[4px] h-[4px] bg-white rounded-sm"></div>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-zinc-300 font-medium truncate">{user.name || "Unknown User"}</span>
                                                    <span className="ml-auto flex shrink-0 items-center justify-center p-0.5 rounded bg-red-500/20 text-red-400 font-semibold text-[8px] uppercase ring-1 ring-inset ring-red-500/30">Live</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Members */}
                    <div className="mb-2">
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide px-2 mb-1">
                            Members — {server.members.length}
                        </p>
                        {server.members.map((member) => {
                            const isOnline = onlineUsers.includes(member.profile.userId);

                            return (
                                <button
                                    key={member.id}
                                    onClick={() => router.push(`/servers/${server.id}/conversations/${member.id}`)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-zinc-400 hover:bg-zinc-700/50 hover:text-white transition group"
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                                            {member.profile.name[0]?.toUpperCase()}
                                        </div>
                                        {isOnline && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#2b2d31]" />
                                        )}
                                    </div>
                                    <span className="text-sm truncate group-hover:text-white transition">{member.profile.name}</span>
                                    {member.role === "ADMIN" && (
                                        <span className="text-[10px] text-yellow-400 ml-auto group-hover:scale-110 transition">👑</span>
                                    )}
                                    {member.role === "MODERATOR" && (
                                        <span className="text-[10px] text-indigo-400 ml-auto group-hover:scale-110 transition">🛡️</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* User Area */}
                <UserArea profileName={profileName} profileImageUrl={profileImageUrl} />
            </div>

            {/* Create Channel Modal */}
            <CreateChannelModal
                serverId={server.id}
                isOpen={showCreateChannel}
                onClose={() => setShowCreateChannel(false)}
            />

            {/* Invite Modal */}
            <InviteModal
                serverId={server.id}
                inviteCode={server.inviteCode}
                isOpen={showInvite}
                onClose={() => setShowInvite(false)}
            />
            {/* Edit Server Modal */}
            {showEditServer && (
                <EditServerModal server={server} onClose={() => setShowEditServer(false)} />
            )}

            {/* Edit Channel Modal */}
            {editChannel && (
                <EditChannelModal
                    serverId={server.id}
                    channel={{
                        id: editChannel.id,
                        name: editChannel.name,
                        type: editChannel.type
                    }}
                    isOpen={!!editChannel}
                    onClose={() => setEditChannel(null)}
                />
            )}
        </>
    );
};

"use client";

import { useState, useEffect } from "react";
import { ChatArea } from "@/components/chat/chat-area";
import { MediaRoom } from "@/components/media-room";
import { Phone, Video, X } from "lucide-react";
import { useSocket } from "@/components/providers/socket-provider";
import { useCallStore, CallerInfo } from "@/hooks/use-call-store";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

interface ChatConversationProps {
    conversationId: string;
    serverId: string;
    otherMemberName: string;
    otherMemberProfileId: string;
    otherMemberUserId: string;
    otherMemberImageUrl: string;
    currentMemberId: string;
    currentMemberRole: string;
    currentMemberName: string;
    currentMemberProfileId: string;
    currentMemberUserId: string;
    currentMemberImageUrl: string;
    chatId: string; // unique name for the LiveKit room
}

export const ChatConversation = ({
    conversationId,
    serverId,
    otherMemberName,
    otherMemberProfileId,
    otherMemberUserId,
    otherMemberImageUrl,
    currentMemberId,
    currentMemberRole,
    currentMemberName,
    currentMemberProfileId,
    currentMemberUserId,
    currentMemberImageUrl,
    chatId,
}: ChatConversationProps) => {
    const searchParams = useSearchParams();
    const isCallType = searchParams?.get("callType");

    const { socket } = useSocket();
    const { setOutgoingCall, activeCall, setActiveCall, setCurrentProfile } = useCallStore();

    // Set current profile in the global store so CallProvider can use it
    useEffect(() => {
        setCurrentProfile({
            id: currentMemberProfileId,
            name: currentMemberName,
            imageUrl: currentMemberImageUrl,
        });
    }, [currentMemberProfileId, currentMemberName, currentMemberImageUrl, setCurrentProfile]);

    // If navigated here with ?callType=audio/video, activate the call
    useEffect(() => {
        if (isCallType && (isCallType === "audio" || isCallType === "video")) {
            // Only activate if not already in a call for this conversation
            if (!activeCall || activeCall.conversationId !== conversationId) {
                setActiveCall({
                    profileId: otherMemberProfileId,
                    userId: otherMemberUserId,
                    name: otherMemberName,
                    imageUrl: otherMemberImageUrl,
                    conversationId,
                    chatId,
                    type: isCallType as "audio" | "video",
                });
            }
        }
    }, [isCallType, conversationId]);

    // Check if there's an active call for THIS conversation
    const isInCall = activeCall && activeCall.conversationId === conversationId;

    const initiateCall = async (type: "audio" | "video") => {
        try {
            // Create call notification in the database via API
            const response = await axios.post("/api/calls", {
                receiverProfileId: otherMemberProfileId,
                conversationId,
                chatId,
                type,
            });

            const callId = response.data.id;

            // Show outgoing modal locally
            setOutgoingCall({
                profileId: otherMemberProfileId,
                userId: otherMemberUserId,
                name: otherMemberName,
                imageUrl: otherMemberImageUrl,
                conversationId,
                chatId,
                type,
                callId,
            });
        } catch (error) {
            console.error("Failed to initiate call:", error);
        }
    };

    return (
        <div className="bg-[#313338] flex flex-col h-full">
            {/* Header */}
            <div className="h-12 border-b border-[#1E1F22] flex items-center px-4 shadow-sm font-semibold shrink-0 gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {otherMemberName?.[0]?.toUpperCase() || "?"}
                </div>
                <h2 className="text-white text-md font-semibold">{otherMemberName || "Unknown User"}</h2>

                {/* Call Controls */}
                <div className="ml-auto flex items-center gap-2">
                    {!isInCall ? (
                        <>
                            <button
                                onClick={() => initiateCall("audio")}
                                className="p-2 rounded-md hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition"
                                title="Start Voice Call"
                            >
                                <Phone className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => initiateCall("video")}
                                className="p-2 rounded-md hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition"
                                title="Start Video Call"
                            >
                                <Video className="h-5 w-5" />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setActiveCall(null)}
                            className="p-2 rounded-md bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 hover:text-rose-300 transition"
                            title="End Call"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            {isInCall ? (
                // Render MediaRoom full-screen when on this call's page
                <MediaRoom
                    chatId={activeCall.chatId}
                    video={activeCall.type === "video"}
                    audio={true}
                    profile={{
                        id: currentMemberProfileId,
                        name: currentMemberName,
                        imageUrl: currentMemberImageUrl
                    }}
                />
            ) : (
                <ChatArea
                    serverId={serverId}
                    channelName={otherMemberName}
                    currentMemberId={currentMemberId}
                    currentMemberRole={currentMemberRole}
                    currentMemberName={currentMemberName}
                    apiUrl="/api/direct-messages"
                    socketUrl="/api/socket/direct-messages"
                    socketQuery={{ conversationId }}
                    paramKey="conversationId"
                    paramValue={conversationId}
                />
            )}
        </div>
    );
};

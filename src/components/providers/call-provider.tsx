"use client";

import { useEffect, useRef, useCallback } from "react";
import { useCallStore, CallerInfo } from "@/hooks/use-call-store";
import { IncomingCallModal } from "@/components/modals/incoming-call-modal";
import { OutgoingCallModal } from "@/components/modals/outgoing-call-modal";
import { MediaRoom } from "@/components/media-room";
import { usePathname, useRouter } from "next/navigation";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";
import axios from "axios";

// This component:
// 1. Polls /api/calls every 2s for incoming call notifications
// 2. Renders MediaRoom GLOBALLY so calls persist across navigation
// 3. Shows PiP overlay when not on the call's DM page

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
    const {
        incomingCall,
        setIncomingCall,
        outgoingCall,
        setOutgoingCall,
        activeCall,
        setActiveCall,
        currentProfile,
    } = useCallStore();

    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const [isPiPMinimized, setIsPiPMinimized] = useState(false);

    // Check if we're currently viewing the call's conversation page
    const isOnCallPage = activeCall
        ? pathname === `/direct-messages/${activeCall.conversationId}`
        : false;

    const checkForIncomingCalls = useCallback(async () => {
        try {
            const response = await axios.get("/api/calls");
            if (response.data.hasIncomingCall && !incomingCall) {
                const call = response.data.call;
                setIncomingCall({
                    profileId: call.profileId,
                    userId: call.userId,
                    name: call.name,
                    imageUrl: call.imageUrl,
                    conversationId: call.conversationId,
                    chatId: call.chatId,
                    type: call.type,
                    callId: call.id,
                } as CallerInfo);
            }
        } catch (error) {
            // Silently fail — we'll retry in 2 seconds
        }
    }, [incomingCall, setIncomingCall]);

    useEffect(() => {
        pollingRef.current = setInterval(checkForIncomingCalls, 2000);
        checkForIncomingCalls();

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, [checkForIncomingCalls]);

    const handleEndCall = () => {
        setActiveCall(null);
    };

    const handleGoToCall = () => {
        if (activeCall) {
            router.push(`/direct-messages/${activeCall.conversationId}?callType=${activeCall.type}`);
        }
    };

    return (
        <>
            {incomingCall && <IncomingCallModal />}
            {outgoingCall && <OutgoingCallModal />}

            {/* Global MediaRoom — persists across navigation */}
            {activeCall && currentProfile && (
                <>
                    {isOnCallPage ? (
                        // Full-screen: rendered inline by ChatConversation via a portal target
                        <div id="global-call-container" className="hidden" />
                    ) : null}

                    {/* Floating PiP overlay — shown when navigating away from the call page */}
                    {!isOnCallPage && (
                        <div
                            className={`fixed z-50 shadow-2xl rounded-xl overflow-hidden border border-zinc-700/50 bg-[#1E1F22] transition-all duration-300 ${isPiPMinimized
                                    ? "bottom-4 right-4 w-72 h-12"
                                    : "bottom-4 right-4 w-80 h-64"
                                }`}
                        >
                            {/* PiP Header */}
                            <div className="flex items-center justify-between px-3 py-2 bg-[#2B2D31] border-b border-zinc-700/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs font-semibold text-zinc-300 truncate">
                                        {activeCall.type === "video" ? "📹" : "📞"} {activeCall.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setIsPiPMinimized(!isPiPMinimized)}
                                        className="p-1 rounded hover:bg-zinc-600/50 text-zinc-400 hover:text-white transition"
                                        title={isPiPMinimized ? "Expand" : "Minimize"}
                                    >
                                        {isPiPMinimized ? (
                                            <Maximize2 className="h-3 w-3" />
                                        ) : (
                                            <Minimize2 className="h-3 w-3" />
                                        )}
                                    </button>
                                    <button
                                        onClick={handleGoToCall}
                                        className="px-2 py-0.5 rounded text-xs bg-indigo-500 hover:bg-indigo-600 text-white font-semibold transition"
                                    >
                                        Open
                                    </button>
                                    <button
                                        onClick={handleEndCall}
                                        className="p-1 rounded hover:bg-rose-500/30 text-rose-400 hover:text-rose-300 transition"
                                        title="End Call"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>

                            {/* PiP MediaRoom */}
                            {!isPiPMinimized && (
                                <div className="h-[calc(100%-36px)]">
                                    <MediaRoom
                                        chatId={activeCall.chatId}
                                        video={activeCall.type === "video"}
                                        audio={true}
                                        profile={currentProfile}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {children}
        </>
    );
};

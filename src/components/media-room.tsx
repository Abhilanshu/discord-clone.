"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
    useLocalParticipant,
    useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";

import { useSocket } from "@/components/providers/socket-provider";
import { AddToCallModal } from "@/components/modals/add-to-call-modal";

interface MediaRoomProps {
    chatId: string;
    video: boolean;
    audio: boolean;
    profile: any;
}

// Custom mic toggle that works on mobile by calling getUserMedia in the click handler
const MobileMicToggle = () => {
    const { localParticipant } = useLocalParticipant();
    const [micEnabled, setMicEnabled] = useState(false);

    useEffect(() => {
        if (localParticipant) {
            setMicEnabled(localParticipant.isMicrophoneEnabled);
        }
    }, [localParticipant, localParticipant?.isMicrophoneEnabled]);

    const toggleMic = async () => {
        if (!localParticipant) return;

        try {
            if (!micEnabled) {
                // Request mic permission IN this click handler (user gesture)
                // This is critical for mobile Chrome
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    // Stop the temporary stream — LiveKit will create its own
                    stream.getTracks().forEach(t => t.stop());
                } catch (e) {
                    // Permission already granted or denied, continue anyway
                }
                await localParticipant.setMicrophoneEnabled(true);
                setMicEnabled(true);
            } else {
                await localParticipant.setMicrophoneEnabled(false);
                setMicEnabled(false);
            }
        } catch (err) {
            console.error("Mic toggle failed:", err);
        }
    };

    return (
        <button
            onClick={toggleMic}
            className={`
                fixed bottom-4 left-1/2 -translate-x-1/2 z-50
                md:hidden
                flex items-center gap-2 px-6 py-4 rounded-full
                font-bold text-lg shadow-2xl
                transition-all transform active:scale-95
                ${micEnabled
                    ? "bg-emerald-500 text-white shadow-emerald-500/30"
                    : "bg-rose-500 text-white shadow-rose-500/30 animate-pulse"
                }
            `}
        >
            {micEnabled ? (
                <>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                    Mute
                </>
            ) : (
                <>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                        <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                    </svg>
                    Tap to Unmute
                </>
            )}
        </button>
    );
};

export const MediaRoom = ({ chatId, video, audio, profile }: MediaRoomProps) => {
    const [token, setToken] = useState("");
    const [error, setError] = useState("");
    const [userConfirmed, setUserConfirmed] = useState(false);
    const [showAddPeople, setShowAddPeople] = useState(false);
    const { socket } = useSocket();
    const router = useRouter();

    const handleDisconnected = () => {
        if (socket && profile) {
            socket.emit("voice:leave", {
                channelId: chatId,
                profileId: profile.id
            });
        }
        router.push("/");
    };

    useEffect(() => {
        if (!socket || !profile) return;

        socket.emit("voice:join", {
            channelId: chatId,
            profile: profile
        });

        return () => {
            socket.emit("voice:leave", {
                channelId: chatId,
                profileId: profile.id
            });
        };
    }, [socket, chatId, profile]);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const resp = await fetch(`/api/livekit?room=${chatId}`);
                if (!resp.ok) {
                    const text = await resp.text();
                    setError(text || "Failed to get token");
                    return;
                }
                const data = await resp.json();
                setToken(data.token);
            } catch (e) {
                setError("Failed to connect to voice server");
            }
        };

        fetchToken();
    }, [chatId]);

    if (error) {
        return (
            <div className="flex flex-col flex-1 justify-center items-center">
                <p className="text-zinc-400 text-sm">
                    {error === "LiveKit not configured" ? (
                        <>
                            <span className="text-yellow-400 font-semibold">⚠️ LiveKit Not Configured</span>
                            <br />
                            <span className="mt-2 block">
                                Add your LiveKit API keys to <code className="bg-zinc-800 px-1 rounded">.env</code>:
                            </span>
                            <code className="block mt-2 bg-zinc-800 p-3 rounded text-xs text-zinc-300">
                                LIVEKIT_API_KEY=your_api_key<br />
                                LIVEKIT_API_SECRET=your_api_secret<br />
                                NEXT_PUBLIC_LIVEKIT_URL=wss://your-app.livekit.cloud
                            </code>
                        </>
                    ) : error}
                </p>
            </div>
        );
    }

    if (token === "") {
        return (
            <div className="flex flex-col flex-1 justify-center items-center">
                <div className="flex items-center gap-2 text-zinc-400">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm">Connecting to voice...</span>
                </div>
            </div>
        );
    }

    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!livekitUrl) {
        return (
            <div className="flex flex-col flex-1 justify-center items-center">
                <p className="text-yellow-400 text-sm font-semibold">⚠️ NEXT_PUBLIC_LIVEKIT_URL not set</p>
            </div>
        );
    }

    // Mobile browsers require a user gesture (tap) to grant microphone access.
    if (!userConfirmed) {
        const handleJoinCall = async () => {
            try {
                // Request mic + camera permission during this tap (user gesture)
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: video
                });
                // Keep the stream alive for a moment, then let LiveKit take over
                setTimeout(() => {
                    stream.getTracks().forEach(t => t.stop());
                }, 3000);

                // Resume AudioContext (required on mobile Chrome)
                try {
                    const ctx = new AudioContext();
                    if (ctx.state === "suspended") await ctx.resume();
                } catch (e) { }
            } catch (err) {
                console.warn("Media permission denied:", err);
            }
            setUserConfirmed(true);
        };

        return (
            <div className="flex flex-col flex-1 justify-center items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <svg className="h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                </div>
                <p className="text-zinc-400 text-sm">Ready to join the call</p>
                <button
                    onClick={handleJoinCall}
                    className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full text-lg transition-all transform hover:scale-105 shadow-lg shadow-green-500/25"
                >
                    🎤 Tap to Join Call
                </button>
                <p className="text-zinc-500 text-xs">Allow microphone access when prompted</p>
            </div>
        );
    }

    return (
        <div className="flex-1 relative" style={{ height: "100%" }}>
            <LiveKitRoom
                data-lk-theme="default"
                serverUrl={livekitUrl}
                token={token}
                connect={true}
                video={video}
                audio={true}
                onDisconnected={handleDisconnected}
                style={{ height: "100%" }}
                options={{
                    audioCaptureDefaults: {
                        autoGainControl: true,
                        echoCancellation: true,
                        noiseSuppression: true,
                    },
                }}
            >
                <VideoConference />
                <RoomAudioRenderer />
                {/* Custom mobile mic toggle — large, floating button for mobile users */}
                <MobileMicToggle />
            </LiveKitRoom>

            {/* Add People button */}
            <button
                onClick={() => setShowAddPeople(true)}
                className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-md shadow-lg transition"
                title="Add people to this call"
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
                Add People
            </button>

            {/* Add People Modal */}
            {showAddPeople && (
                <AddToCallModal
                    isOpen={showAddPeople}
                    onClose={() => setShowAddPeople(false)}
                    currentChatId={chatId}
                    conversationId={chatId}
                />
            )}
        </div>
    );
};

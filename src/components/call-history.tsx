"use client";

import { useEffect, useState } from "react";
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface CallRecord {
    id: string;
    otherUser: {
        id: string;
        name: string;
        imageUrl: string;
    };
    conversationId: string;
    chatId: string;
    type: "audio" | "video";
    status: string;
    isOutgoing: boolean;
    createdAt: string;
}

export const CallHistory = () => {
    const [calls, setCalls] = useState<CallRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchCalls = async () => {
            try {
                const response = await axios.get("/api/calls/history");
                setCalls(response.data);
            } catch (error) {
                console.error("Failed to fetch call history:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCalls();
    }, []);

    const getStatusIcon = (call: CallRecord) => {
        if (call.status === "MISSED") {
            return <PhoneMissed className="h-4 w-4 text-rose-400" />;
        }
        if (call.isOutgoing) {
            return <PhoneOutgoing className="h-4 w-4 text-emerald-400" />;
        }
        return <PhoneIncoming className="h-4 w-4 text-blue-400" />;
    };

    const getStatusText = (call: CallRecord) => {
        if (call.status === "MISSED") return "Missed";
        if (call.status === "DECLINED") return "Declined";
        if (call.status === "CANCELLED") return "Cancelled";
        if (call.status === "ACCEPTED") return call.isOutgoing ? "Outgoing" : "Incoming";
        return "Ringing";
    };

    const handleCallAgain = (call: CallRecord) => {
        router.push(`/direct-messages/${call.conversationId}`);
    };

    const formatTime = (dateStr: string) => {
        try {
            return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
        } catch {
            return "recently";
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-zinc-400">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm">Loading call history...</span>
                </div>
            </div>
        );
    }

    if (calls.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <Phone className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-sm font-medium">No call history yet</p>
                <p className="text-xs mt-1">Start a call with a friend to see it here</p>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {calls.map((call) => (
                <button
                    key={call.id}
                    onClick={() => handleCallAgain(call)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-700/30 transition group"
                >
                    {/* Avatar */}
                    <div className="relative w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {call.otherUser.name[0]?.toUpperCase()}
                    </div>

                    {/* Call Info */}
                    <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">
                            {call.otherUser.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            {getStatusIcon(call)}
                            <span className={`text-xs ${call.status === "MISSED" ? "text-rose-400" :
                                    call.status === "DECLINED" ? "text-zinc-500" :
                                        "text-zinc-400"
                                }`}>
                                {getStatusText(call)} · {call.type === "video" ? "Video" : "Voice"}
                            </span>
                        </div>
                    </div>

                    {/* Time */}
                    <span className="text-xs text-zinc-500 shrink-0">
                        {formatTime(call.createdAt)}
                    </span>

                    {/* Call again button */}
                    <div className="opacity-0 group-hover:opacity-100 transition">
                        {call.type === "video" ? (
                            <Video className="h-4 w-4 text-zinc-400" />
                        ) : (
                            <Phone className="h-4 w-4 text-zinc-400" />
                        )}
                    </div>
                </button>
            ))}
        </div>
    );
};

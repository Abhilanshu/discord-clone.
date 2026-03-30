"use client";

import { useEffect, useRef } from "react";
import { useCallStore } from "@/hooks/use-call-store";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PhoneOff } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useCallRingtone } from "@/hooks/use-call-ringtone";

export const OutgoingCallModal = () => {
    const { outgoingCall, setOutgoingCall, setActiveCall } = useCallStore();
    const router = useRouter();
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Play outgoing call ringtone (beep)
    useCallRingtone(!!outgoingCall, "outgoing");

    // Poll the call status to detect when the receiver accepts/declines
    useEffect(() => {
        if (!outgoingCall?.callId) return;

        const checkCallStatus = async () => {
            try {
                const response = await axios.get(`/api/calls/${outgoingCall.callId}`);
                const { status } = response.data;

                if (status === "ACCEPTED") {
                    // Call was accepted! Navigate to the LiveKit room
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    setActiveCall(outgoingCall);
                    setOutgoingCall(null);
                    router.push(`/direct-messages/${outgoingCall.conversationId}?callType=${outgoingCall.type}`);
                } else if (status === "DECLINED" || status === "CANCELLED" || status === "MISSED") {
                    // Call was declined or cancelled
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    setOutgoingCall(null);
                }
            } catch (error) {
                // Silently fail — will retry
            }
        };

        pollingRef.current = setInterval(checkCallStatus, 2000);
        // Also check immediately
        checkCallStatus();

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [outgoingCall, setOutgoingCall, setActiveCall, router]);

    if (!outgoingCall) return null;

    const onCancel = async () => {
        try {
            if (pollingRef.current) clearInterval(pollingRef.current);
            if (outgoingCall.callId) {
                await axios.patch("/api/calls", {
                    callId: outgoingCall.callId,
                    action: "cancel"
                });
            }
            setOutgoingCall(null);
        } catch (error) {
            console.error("Failed to cancel call:", error);
            setOutgoingCall(null);
        }
    };

    return (
        <Dialog open={true} onOpenChange={() => { }}>
            <DialogContent className="bg-[#2B2D31] border-none text-white max-w-sm rounded-[16px] p-0 overflow-hidden hide-close">
                <DialogTitle className="sr-only">Outgoing Call</DialogTitle>
                <div className="flex flex-col items-center justify-center p-8 space-y-6">
                    <div className="relative w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center text-4xl font-bold overflow-hidden shadow-2xl ring-4 ring-[#1E1F22]">
                        {outgoingCall.imageUrl ? (
                            <Image src={outgoingCall.imageUrl} alt="Avatar" fill className="object-cover" />
                        ) : (
                            outgoingCall.name[0]?.toUpperCase()
                        )}
                    </div>

                    <div className="text-center space-y-1">
                        <p className="text-zinc-400 font-semibold uppercase text-xs tracking-wider animate-pulse">Calling...</p>
                        <h2 className="text-2xl font-bold">{outgoingCall.name}</h2>
                    </div>

                    <div className="flex items-center justify-center mt-4">
                        <Button
                            onClick={onCancel}
                            className="p-0 h-14 w-14 rounded-full bg-rose-500 hover:bg-rose-600 text-white transition-all transform hover:scale-105"
                        >
                            <PhoneOff className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

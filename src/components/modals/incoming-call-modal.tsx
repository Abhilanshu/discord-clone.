"use client";

import { useCallStore } from "@/hooks/use-call-store";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PhoneCall, PhoneOff } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useCallRingtone } from "@/hooks/use-call-ringtone";

export const IncomingCallModal = () => {
    const { incomingCall, setIncomingCall, setActiveCall } = useCallStore();
    const router = useRouter();

    // Play incoming call ringtone (hook must be called unconditionally)
    useCallRingtone(!!incomingCall, "incoming");

    if (!incomingCall) return null;

    const onAccept = async () => {
        try {
            if (incomingCall.callId) {
                await axios.patch("/api/calls", {
                    callId: incomingCall.callId,
                    action: "accept"
                });
            }

            setActiveCall(incomingCall);
            setIncomingCall(null);
            router.push(`/direct-messages/${incomingCall.conversationId}?callType=${incomingCall.type}`);
        } catch (error) {
            console.error("Failed to accept call:", error);
        }
    };

    const onDecline = async () => {
        try {
            if (incomingCall.callId) {
                await axios.patch("/api/calls", {
                    callId: incomingCall.callId,
                    action: "decline"
                });
            }
            setIncomingCall(null);
        } catch (error) {
            console.error("Failed to decline call:", error);
        }
    };

    return (
        <Dialog open={true} onOpenChange={() => { }}>
            <DialogContent className="bg-[#2B2D31] border-none text-white max-w-sm rounded-[16px] p-0 overflow-hidden hide-close">
                <DialogTitle className="sr-only">Incoming Call</DialogTitle>
                <div className="flex flex-col items-center justify-center p-8 space-y-6">
                    <div className="relative w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center text-4xl font-bold overflow-hidden shadow-2xl ring-4 ring-[#1E1F22]">
                        {incomingCall.imageUrl ? (
                            <Image src={incomingCall.imageUrl} alt="Avatar" fill className="object-cover" />
                        ) : (
                            incomingCall.name[0]?.toUpperCase()
                        )}
                    </div>

                    <div className="text-center space-y-1">
                        <p className="text-zinc-400 font-semibold uppercase text-xs tracking-wider animate-pulse">Incoming {incomingCall.type === "video" ? "Video" : "Voice"} Call</p>
                        <h2 className="text-2xl font-bold">{incomingCall.name}</h2>
                    </div>

                    <div className="flex items-center gap-6 mt-4">
                        <Button
                            onClick={onDecline}
                            className="p-0 h-14 w-14 rounded-full bg-rose-500 hover:bg-rose-600 text-white transition-all transform hover:scale-105"
                        >
                            <PhoneOff className="h-6 w-6" />
                        </Button>
                        <Button
                            onClick={onAccept}
                            className="p-0 h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 text-white transition-all transform hover:scale-105 animate-bounce"
                        >
                            <PhoneCall className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

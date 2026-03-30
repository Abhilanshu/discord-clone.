"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { useOrigin } from "@/hooks/use-origin";

interface InviteModalProps {
    serverId: string;
    inviteCode: string;
    isOpen: boolean;
    onClose: () => void;
}

export const InviteModal = ({ serverId, inviteCode, isOpen, onClose }: InviteModalProps) => {
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentCode, setCurrentCode] = useState(inviteCode);
    const origin = useOrigin();

    const inviteUrl = `${origin}/invite/${currentCode}?bypass-tunnel-reminder=true`;

    const onCopy = () => {
        navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const onNewLink = async () => {
        try {
            setIsLoading(true);
            const response = await axios.patch(`/api/servers/${serverId}/invite-code`);
            setCurrentCode(response.data.inviteCode);
        } catch (error) {
            console.error("Failed to generate new link:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#313338] text-white p-0 overflow-hidden border-none sm:max-w-[440px] shadow-2xl rounded-md">
                <DialogHeader className="pt-6 px-6 pb-2">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 transition"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <DialogTitle className="text-xl font-bold text-zinc-100">
                        Invite friends to {serverId ? "this server" : "Server"}
                    </DialogTitle>
                </DialogHeader>
                <div className="px-6 py-4 space-y-4">
                    <div className="space-y-2">
                        <Label className="uppercase text-[11px] font-bold text-zinc-400 tracking-wide">
                            Send a server invite link to a friend
                        </Label>
                        <div className="flex items-center gap-2">
                            <Input
                                value={inviteUrl}
                                readOnly
                                className="flex-1 bg-[#1E1F22] border-0 focus-visible:ring-0 text-zinc-300 font-mono text-xs h-10 px-3"
                            />
                            <Button
                                onClick={onCopy}
                                size="sm"
                                className={`${copied ? 'bg-green-500 hover:bg-green-600' : 'bg-indigo-500 hover:bg-indigo-600'} text-white transition rounded-[3px] h-10 px-6 font-semibold`}
                            >
                                {copied ? "Copied" : "Copy"}
                            </Button>
                        </div>
                    </div>

                    <div className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
                        Your invite link expires in 7 days.
                        <button
                            onClick={onNewLink}
                            disabled={isLoading}
                            className="text-[#00A8FC] hover:underline font-medium ml-1 disabled:opacity-50 flex items-center"
                        >
                            Edit invite link
                            {isLoading && (
                                <svg className="inline animate-spin h-3 w-3 ml-1" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

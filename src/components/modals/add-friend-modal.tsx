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
import { useOrigin } from "@/hooks/use-origin";
import { Check, Copy, UserPlus } from "lucide-react";

interface AddFriendModalProps {
    profileId: string;
    isOpen: boolean;
    onClose: () => void;
}

export const AddFriendModal = ({ profileId, isOpen, onClose }: AddFriendModalProps) => {
    const [copied, setCopied] = useState(false);
    const origin = useOrigin();

    const friendInviteUrl = `${origin}/friend-invite/${profileId}`;

    const onCopy = () => {
        navigator.clipboard.writeText(friendInviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
                    <DialogTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-emerald-500" />
                        Add Friend
                    </DialogTitle>
                </DialogHeader>
                <div className="px-6 py-4 space-y-4">
                    <div className="space-y-2">
                        <Label className="uppercase text-[11px] font-bold text-zinc-400 tracking-wide">
                            Share your personal friend link
                        </Label>
                        <p className="text-xs text-zinc-400">
                            Others can add you as a friend globally outside of any server using this link.
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <Input
                                value={friendInviteUrl}
                                readOnly
                                className="flex-1 bg-[#1E1F22] border-0 focus-visible:ring-0 text-zinc-300 font-mono text-[11px] h-10 px-3"
                            />
                            <Button
                                onClick={onCopy}
                                size="sm"
                                variant="primary"
                                className={`transition rounded-[3px] h-10 px-4 font-semibold shrink-0 ${copied ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-500 hover:bg-indigo-600"
                                    }`}
                            >
                                {copied ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4 text-white" />}
                            </Button>
                        </div>
                    </div>

                    <div className="bg-[#2B2D31] p-4 rounded-md">
                        <p className="text-[11px] text-zinc-400">
                            <span className="text-emerald-500 font-bold">Pro-tip:</span> You can also search for friends in the dashboard if you know their email or username!
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

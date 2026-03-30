"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface CreateChannelModalProps {
    serverId: string;
    isOpen: boolean;
    onClose: () => void;
}

const channelTypes = [
    { value: "TEXT", label: "Text", icon: "#", description: "Send messages, images, GIFs, emoji, and more" },
    { value: "AUDIO", label: "Voice", icon: "🔊", description: "Hang out together with voice and screen share" },
    { value: "VIDEO", label: "Video", icon: "📹", description: "Hang out together with video, voice, and screen share" },
];

export const CreateChannelModal = ({ serverId, isOpen, onClose }: CreateChannelModalProps) => {
    const router = useRouter();
    const [channelName, setChannelName] = useState("");
    const [channelType, setChannelType] = useState("TEXT");
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!channelName.trim()) return;

        try {
            setIsLoading(true);
            await axios.post(`/api/channels?serverId=${serverId}`, {
                name: channelName.toLowerCase().replace(/\s+/g, "-"),
                type: channelType,
            });

            setChannelName("");
            setChannelType("TEXT");
            onClose();
            router.refresh();
        } catch (error) {
            console.error("Failed to create channel:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader className="relative">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-zinc-400 hover:text-white transition rounded-full hover:bg-zinc-700/50 p-1"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <DialogTitle>Create Channel</DialogTitle>
                    <DialogDescription>
                        Create a new text, voice, or video channel.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit}>
                    <div className="px-6 py-4 space-y-4">
                        {/* Channel Type Selection */}
                        <div>
                            <Label>Channel Type</Label>
                            <div className="space-y-2 mt-1">
                                {channelTypes.map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setChannelType(type.value)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-md transition ${channelType === type.value
                                            ? "bg-zinc-600/50 text-white"
                                            : "bg-[#2b2d31] text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200"
                                            }`}
                                    >
                                        <span className="text-xl w-6 text-center">{type.icon}</span>
                                        <div className="text-left">
                                            <p className="text-sm font-medium">{type.label}</p>
                                            <p className="text-xs text-zinc-500">{type.description}</p>
                                        </div>
                                        <div className="ml-auto">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${channelType === type.value
                                                ? "border-white"
                                                : "border-zinc-600"
                                                }`}>
                                                {channelType === type.value && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Channel Name */}
                        <div>
                            <Label htmlFor="channel-name">Channel Name</Label>
                            <div className="flex items-center gap-1">
                                <span className="text-zinc-500 text-lg">
                                    {channelType === "TEXT" ? "#" : channelType === "AUDIO" ? "🔊" : "📹"}
                                </span>
                                <Input
                                    id="channel-name"
                                    disabled={isLoading}
                                    value={channelName}
                                    onChange={(e) => setChannelName(e.target.value)}
                                    placeholder="new-channel"
                                    autoFocus
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={isLoading}
                            size="sm"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !channelName.trim()}
                            size="md"
                        >
                            {isLoading ? "Creating..." : "Create Channel"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

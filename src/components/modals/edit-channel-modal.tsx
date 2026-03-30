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

interface EditChannelModalProps {
    serverId: string;
    channel: {
        id: string;
        name: string;
        type: "TEXT" | "AUDIO" | "VIDEO";
    };
    isOpen: boolean;
    onClose: () => void;
}

const channelTypes = [
    { value: "TEXT", label: "Text", icon: "#", description: "Send messages, images, GIFs, emoji, and more" },
    { value: "AUDIO", label: "Voice", icon: "🔊", description: "Hang out together with voice and screen share" },
    { value: "VIDEO", label: "Video", icon: "📹", description: "Hang out together with video, voice, and screen share" },
];

export const EditChannelModal = ({ serverId, channel, isOpen, onClose }: EditChannelModalProps) => {
    const router = useRouter();
    const [channelName, setChannelName] = useState(channel.name);
    const [channelType, setChannelType] = useState(channel.type);
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!channelName.trim()) return;

        try {
            setIsLoading(true);
            await axios.patch(`/api/channels/${channel.id}?serverId=${serverId}`, {
                name: channelName.toLowerCase().replace(/\s+/g, "-"),
                type: channelType,
            });

            onClose();
            router.refresh();
        } catch (error) {
            console.error("Failed to update channel:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const onDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete #${channel.name}? This action cannot be undone.`)) return;

        try {
            setIsLoading(true);
            await axios.delete(`/api/channels/${channel.id}?serverId=${serverId}`);
            onClose();
            router.push(`/servers/${serverId}`);
            router.refresh();
        } catch (error) {
            console.error("Failed to delete channel:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#313338] text-white p-0 overflow-hidden sm:max-w-[420px] rounded-md shadow-2xl">
                <DialogHeader className="pt-8 px-6">
                    <DialogTitle className="text-2xl text-center font-bold text-white m-0 border-none">
                        Edit Channel
                    </DialogTitle>
                    <DialogDescription className="text-center text-zinc-400 mt-2 text-[15px] leading-snug">
                        Change the channel name or type.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit}>
                    <div className="px-6 py-4 space-y-4">
                        {/* Channel Type Selection */}
                        <div>
                            <Label className="uppercase text-xs font-bold text-zinc-400 mb-2 block">Channel Type</Label>
                            <div className="space-y-2 mt-1">
                                {channelTypes.map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setChannelType(type.value as "TEXT" | "AUDIO" | "VIDEO")}
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
                            <Label htmlFor="edit-channel-name" className="uppercase text-xs font-bold text-zinc-400 mb-2 block">
                                Channel Name
                            </Label>
                            <div className="flex items-center gap-1">
                                <span className="text-zinc-500 text-lg">
                                    {channelType === "TEXT" ? "#" : channelType === "AUDIO" ? "🔊" : "📹"}
                                </span>
                                <Input
                                    id="edit-channel-name"
                                    disabled={isLoading || channel.name === "general"}
                                    value={channelName}
                                    onChange={(e) => setChannelName(e.target.value)}
                                    placeholder="new-channel"
                                    className="bg-[#1E1F22] border-0 focus-visible:ring-0 text-white focus-visible:ring-offset-0 h-10 px-3 flex-1"
                                />
                            </div>
                            {channel.name === "general" && (
                                <p className="text-xs text-zinc-400 mt-1">The 'general' channel cannot be renamed or deleted.</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="bg-[#2B2D31] px-6 py-4 flex items-center justify-between">
                        <Button
                            type="button"
                            onClick={onDelete}
                            disabled={isLoading || channel.name === "general"}
                            variant="ghost"
                            className="text-red-400 hover:text-red-500 hover:bg-transparent px-0 text-sm font-semibold"
                        >
                            Delete Channel
                        </Button>
                        <Button
                            className="bg-indigo-500 text-white hover:bg-indigo-600 rounded-[3px] font-semibold flex items-center gap-2 px-6"
                            disabled={isLoading || !channelName.trim()}
                            type="submit"
                        >
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

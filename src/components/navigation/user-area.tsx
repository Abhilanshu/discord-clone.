"use client";

import { Mic, MicOff, Headphones, Settings } from "lucide-react";
import { useState } from "react";
import { useMediaControls } from "@/hooks/use-media-controls";
import { useSocket } from "@/components/providers/socket-provider";
import { UserSettingsModal } from "@/components/modals/user-settings-modal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface UserAreaProps {
    profileName: string;
    profileImageUrl?: string;
}

export const UserArea = ({ profileName, profileImageUrl }: UserAreaProps) => {
    const [showSettings, setShowSettings] = useState(false);
    const { isMuted, isDeafened, toggleMute, toggleDeafen } = useMediaControls();
    const { socket } = useSocket();
    const [status, setStatus] = useState<"Online" | "Idle" | "Do Not Disturb" | "Invisible">("Online");

    const handleMute = () => {
        if (isDeafened) return; // Cannot unmute while deafened
        toggleMute();
        socket?.emit("voice:stateChange", { isMuted: !isMuted, isDeafened });
    };

    const handleDeafen = () => {
        toggleDeafen();
        const newDeafened = !isDeafened;
        socket?.emit("voice:stateChange", { 
            isDeafened: newDeafened, 
            isMuted: newDeafened ? true : isMuted 
        });
    };

    const getStatusColor = () => {
        switch (status) {
            case "Online": return "bg-emerald-500";
            case "Idle": return "bg-yellow-500";
            case "Do Not Disturb": return "bg-red-500";
            case "Invisible": return "bg-zinc-500";
        }
    };

    return (
        <>
            <div className="h-[52px] bg-[#232428] flex items-center px-2 gap-2 mt-auto shrink-0 w-full">
                <Popover>
                    <PopoverTrigger asChild>
                        <div className="flex items-center gap-2 flex-1 min-w-0 px-1 py-1 rounded-md hover:bg-zinc-700/50 cursor-pointer transition">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0 relative">
                                {profileImageUrl ? (
                                    <img src={profileImageUrl} alt="profile" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    profileName[0]?.toUpperCase()
                                )}
                                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${getStatusColor()} rounded-full border-[3px] border-[#232428]`} />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                                <p className="text-sm text-white font-semibold truncate leading-none mb-1">{profileName}</p>
                                <p className="text-[11px] text-zinc-400 leading-none truncate">{status}</p>
                            </div>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2 bg-[#111214] border border-[#1e1f22] rounded shadow-lg translate-y-[-10px] translate-x-12" side="top" align="start">
                        <div className="space-y-[2px]">
                            {["Online", "Idle", "Do Not Disturb", "Invisible"].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatus(s as any)}
                                    className="w-full flex items-center gap-2 px-2 py-2 rounded-[4px] hover:bg-indigo-500 hover:text-white text-zinc-300 text-sm font-medium transition cursor-pointer"
                                >
                                    <div className={`w-2.5 h-2.5 rounded-full ${s === "Online" ? "bg-emerald-500" : s === "Idle" ? "bg-yellow-500" : s === "Do Not Disturb" ? "bg-red-500" : "bg-zinc-500"}`} />
                                    {s}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="flex items-center shrink-0">
                    <button 
                        onClick={handleMute}
                        className={`w-8 h-8 flex items-center justify-center rounded-md ${isMuted || isDeafened ? 'text-rose-500 hover:bg-zinc-700/50' : 'text-zinc-400'} hover:text-zinc-200 hover:bg-zinc-700/50 transition relative group`}
                    >
                        {isMuted || isDeafened ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        <span className="absolute -top-8 bg-black text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                            {isMuted || isDeafened ? "Unmute" : "Mute"}
                        </span>
                    </button>
                    <button 
                        onClick={handleDeafen}
                        className={`w-8 h-8 flex items-center justify-center rounded-md ${isDeafened ? 'text-rose-500' : 'text-zinc-400'} hover:text-zinc-200 hover:bg-zinc-700/50 transition relative group`}
                    >
                        <Headphones className="w-5 h-5" />
                        {isDeafened && <div className="absolute w-5 h-0.5 bg-rose-500 rotate-45 pointer-events-none"></div>}
                        <span className="absolute -top-8 bg-black text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                            {isDeafened ? "Undeafen" : "Deafen"}
                        </span>
                    </button>
                    <button
                        className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition relative group"
                        onClick={() => setShowSettings(true)}
                    >
                        <Settings className="w-4 h-4" />
                        <span className="absolute -top-8 bg-black text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                            User Settings
                        </span>
                    </button>
                </div>
            </div>

            {showSettings && <UserSettingsModal onClose={() => setShowSettings(false)} />}
        </>
    );
};

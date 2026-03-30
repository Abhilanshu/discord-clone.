"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, User2, Volume2, Monitor, Palette } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

interface UserSettingsModalProps {
    onClose: () => void;
}

export const UserSettingsModal = ({ onClose }: UserSettingsModalProps) => {
    const { theme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState("My Account");

    const tabs = [
        { name: "My Account", icon: User2 },
        { name: "Voice & Video", icon: Volume2 },
        { name: "Appearance", icon: Palette },
        { name: "Window Settings", icon: Monitor },
    ];

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="bg-[#313338] text-white p-0 overflow-hidden sm:max-w-4xl w-full h-[80vh] rounded-md shadow-2xl flex border-0">
                {/* Sidebar */}
                <div className="w-[35%] bg-[#2B2D31] h-full flex flex-col justify-start py-10 pb-0 border-r border-[#1E1F22]">
                    <div className="w-full max-w-[218px] ml-auto pr-2 space-y-[2px]">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase px-2.5 pb-2">User Settings</h3>
                        {tabs.map(tab => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[4px] text-[15px] font-medium transition ${activeTab === tab.name
                                    ? "bg-zinc-700/50 text-zinc-200"
                                    : "text-zinc-400 hover:bg-zinc-700/30 hover:text-zinc-300"
                                    }`}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-[#313338] h-full pt-10 px-10 pb-20 overflow-y-auto relative">
                    <button
                        onClick={onClose}
                        className="fixed right-12 top-10 flex flex-col items-center gap-1 group z-50 text-zinc-400 hover:text-zinc-200 transition"
                    >
                        <div className="w-9 h-9 border-2 border-zinc-400 group-hover:border-zinc-200 rounded-full flex items-center justify-center transition">
                            <X className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold uppercase tracking-wide">ESC</span>
                    </button>

                    <h2 className="text-xl font-bold text-white mb-6 leading-none">
                        {activeTab}
                    </h2>

                    {activeTab === "My Account" && (
                        <div className="space-y-6">
                            <div className="bg-[#1E1F22] rounded-lg p-6 flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-indigo-500 rounded-full mb-4 flex items-center justify-center text-3xl font-bold">
                                    ?
                                </div>
                                <h3 className="text-xl font-semibold mb-1">Your Profile</h3>
                                <p className="text-sm text-zinc-400 mb-6">You can update your avatar and username using Clerk's built-in account management.</p>
                                <Button className="bg-indigo-500 hover:bg-indigo-600 transition" onClick={() => window.open('https://clerk.com', '_blank')}>
                                    Open Clerk Profile
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab === "Voice & Video" && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-4">Voice Settings</h3>
                                <div className="bg-[#2B2D31] p-4 rounded-md space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-300 font-medium text-sm">Input Volume</span>
                                        <input type="range" className="w-48 accent-indigo-500" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-300 font-medium text-sm">Output Volume</span>
                                        <input type="range" className="w-48 accent-indigo-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "Appearance" && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-4">Theme</h3>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setTheme("dark")}
                                        className={`px-4 py-8 rounded-md flex-1 font-medium transition ${theme === "dark" || !theme ? "bg-indigo-500 text-white" : "bg-[#2B2D31] text-zinc-400 hover:bg-zinc-700/50"}`}
                                    >
                                        Dark
                                    </button>
                                    <button
                                        onClick={() => setTheme("light")}
                                        className={`px-4 py-8 rounded-md flex-1 font-medium transition ${theme === "light" ? "bg-indigo-500 text-white" : "bg-white text-zinc-600 hover:bg-zinc-100"}`}
                                    >
                                        Light
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

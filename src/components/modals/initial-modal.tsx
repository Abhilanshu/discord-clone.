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
import { FileUpload } from "@/components/file-upload";
import { ChevronRight, Gamepad2, Users, BookOpen, GraduationCap, ArrowLeft, X } from "lucide-react";

export const InitialModal = () => {
    const router = useRouter();
    const [step, setStep] = useState<"templates" | "customize">("templates");
    const [serverName, setServerName] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!serverName.trim()) return;

        try {
            setIsLoading(true);

            const response = await axios.post("/api/servers", {
                name: serverName,
                imageUrl
            });

            router.push(`/servers/${response.data.id}`);
            router.refresh();
        } catch (error) {
            console.error("Failed to create server:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={true}>
            <DialogContent className="bg-[#313338] text-white p-0 overflow-hidden sm:max-w-[440px] rounded-md shadow-2xl">
                {step === "templates" && (
                    <div className="flex flex-col h-full w-full">
                        <DialogHeader className="pt-8 px-6 pb-4 relative">
                            <button
                                onClick={() => router.push("/")}
                                className="absolute right-4 top-4 text-zinc-400 hover:text-white transition rounded-full hover:bg-zinc-700/50 p-1"
                            >
                                <X className="h-5 w-5" />
                            </button>
                            <DialogTitle className="text-2xl text-center font-bold text-white border-none m-0">
                                Create Your Server
                            </DialogTitle>
                            <DialogDescription className="text-center text-zinc-400 mt-2 text-[15px] leading-snug">
                                Your server is where you and your friends hang out. Make yours and start talking.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="px-5 space-y-4 pb-4">
                            <button
                                onClick={() => setStep("customize")}
                                className="w-full flex items-center justify-between p-4 rounded-lg border border-zinc-700/50 hover:bg-[#2B2D31] transition duration-200"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-xl">🏔️</span>
                                    </div>
                                    <span className="font-bold text-zinc-200">Create My Own</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-zinc-400" />
                            </button>

                            <div className="pt-2">
                                <h3 className="text-xs font-bold text-zinc-400 uppercase mb-3 px-1 tracking-wide">
                                    START FROM A TEMPLATE
                                </h3>
                                <div className="space-y-2">
                                    {[
                                        { id: "gaming", label: "Gaming", icon: Gamepad2, color: "text-indigo-400", bg: "bg-indigo-500/10" },
                                        { id: "friends", label: "Friends", icon: Users, color: "text-rose-400", bg: "bg-rose-500/10" },
                                        { id: "study", label: "Study Group", icon: BookOpen, color: "text-orange-400", bg: "bg-orange-500/10" },
                                        { id: "school", label: "School Club", icon: GraduationCap, color: "text-blue-400", bg: "bg-blue-500/10" },
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setStep("customize")}
                                            className="w-full flex items-center justify-between p-3 rounded-lg border border-zinc-700/50 hover:bg-[#2B2D31] transition duration-200 group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full ${t.bg} flex items-center justify-center shrink-0`}>
                                                    <t.icon className={`h-4 w-4 ${t.color}`} />
                                                </div>
                                                <span className="font-bold text-zinc-200 tracking-tight">{t.label}</span>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-zinc-300" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="bg-[#2B2D31] px-6 py-4 flex flex-col items-center">
                            <h3 className="text-xl font-medium text-white mb-4">Have an invite already?</h3>
                            <Button className="w-full font-semibold bg-zinc-600 hover:bg-zinc-500 text-white rounded-[3px] py-6 text-[15px] transition">
                                Join a Server
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === "customize" && (
                    <div className="flex flex-col h-full w-full">
                        <DialogHeader className="pt-8 px-6 bg-[#313338] relative">
                            <button
                                onClick={() => setStep("templates")}
                                className="absolute left-6 top-8 text-zinc-400 hover:text-white transition rounded-full hover:bg-zinc-700 p-1"
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </button>
                            <button
                                onClick={() => router.push("/")}
                                className="absolute right-4 top-4 text-zinc-400 hover:text-white transition rounded-full hover:bg-zinc-700/50 p-1"
                            >
                                <X className="h-5 w-5" />
                            </button>
                            <DialogTitle className="text-2xl text-center font-bold text-white mt-2 m-0 border-none">
                                Customize your server
                            </DialogTitle>
                            <DialogDescription className="text-center text-zinc-400 mt-2 text-[15px] leading-snug">
                                Give your new server a personality with a name and an icon.
                                You can always change it later.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={onSubmit}>
                            <div className="px-6 py-6 space-y-6">
                                {/* Server Icon Upload */}
                                <div className="flex items-center justify-center">
                                    <FileUpload
                                        endpoint="serverImage"
                                        value={imageUrl}
                                        onChange={(url) => {
                                            if (url) setImageUrl(url);
                                        }}
                                    />
                                </div>

                                {/* Server Name Input */}
                                <div className="space-y-2">
                                    <Label className="uppercase text-xs font-bold text-zinc-400">
                                        Server Name
                                    </Label>
                                    <Input
                                        disabled={isLoading}
                                        className="bg-[#1E1F22] border-0 focus-visible:ring-0 text-white focus-visible:ring-offset-0 h-10 px-3"
                                        placeholder="Enter server name"
                                        value={serverName}
                                        onChange={(e) => setServerName(e.target.value)}
                                        autoFocus
                                    />
                                    <p className="text-[11px] text-zinc-400 mt-1 leading-tight mb-2">
                                        By creating a server, you agree to Discord's <span className="text-indigo-400 cursor-pointer hover:underline">Community Guidelines</span>.
                                    </p>
                                </div>
                            </div>

                            <DialogFooter className="bg-[#2B2D31] px-6 py-4 flex items-center justify-between">
                                <Button
                                    type="button"
                                    onClick={() => setStep("templates")}
                                    className="bg-transparent text-white hover:underline hover:bg-transparent font-medium px-0"
                                >
                                    Back
                                </Button>
                                <Button
                                    className="bg-indigo-500 text-white hover:bg-indigo-600 rounded-[3px] font-semibold flex items-center gap-2"
                                    disabled={isLoading || !serverName.trim()}
                                    type="submit"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Creating...
                                        </>
                                    ) : "Create"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

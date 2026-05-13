"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const InviteClient = ({ profileId, name, imageUrl }: { profileId: string, name: string, imageUrl: string }) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const onAccept = async () => {
        try {
            setIsLoading(true);
            await axios.post("/api/friends/request", { profileId });
            router.push("/direct-messages");
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-[#313338]">
            <div className="w-[400px] bg-[#2b2d31] shadow-xl rounded-xl overflow-hidden p-6">
                <div className="text-center pt-2">
                    <div className="flex justify-center mb-4">
                        <img src={imageUrl} alt={name} className="h-24 w-24 rounded-full object-cover shadow-md border-4 border-[#2b2d31]" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-2">{name}</div>
                    <div className="text-zinc-400 text-sm mb-6">
                        has invited you to become friends on Discord.
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    <Button 
                        disabled={isLoading}
                        onClick={onAccept}
                        className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium h-11"
                    >
                        Accept Friend Request
                    </Button>
                    <Button 
                        disabled={isLoading}
                        onClick={() => router.push("/")}
                        variant="ghost"
                        className="w-full text-zinc-400 hover:text-white hover:bg-zinc-800/50 font-medium h-11"
                    >
                        Decline
                    </Button>
                </div>
            </div>
        </div>
    );
};

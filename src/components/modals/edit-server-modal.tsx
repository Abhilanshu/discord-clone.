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

interface EditServerModalProps {
    server: {
        id: string;
        name: string;
        imageUrl: string;
    };
    onClose: () => void;
}

export const EditServerModal = ({ server, onClose }: EditServerModalProps) => {
    const router = useRouter();
    const [name, setName] = useState(server.name);
    const [imageUrl, setImageUrl] = useState(server.imageUrl);
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) return;

        try {
            setIsLoading(true);
            await axios.patch(`/api/servers/${server.id}`, {
                name,
                imageUrl
            });

            router.refresh();
            onClose();
        } catch (error) {
            console.error("Failed to update server:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const onDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this server? This action cannot be undone.")) return;

        try {
            setIsLoading(true);
            await axios.delete(`/api/servers/${server.id}`);
            router.push("/");
            router.refresh();
        } catch (error) {
            console.error("Failed to delete server:", error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="bg-[#313338] text-white p-0 overflow-hidden sm:max-w-[420px] rounded-md shadow-2xl">
                <DialogHeader className="pt-8 px-6">
                    <DialogTitle className="text-2xl text-center font-bold text-white m-0 border-none">
                        Server Overview
                    </DialogTitle>
                    <DialogDescription className="text-center text-zinc-400 mt-2 text-[15px] leading-snug">
                        Change your server's personality or delete it forever.
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
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="bg-[#2B2D31] px-6 py-4 flex items-center justify-between">
                        <Button
                            type="button"
                            onClick={onDelete}
                            disabled={isLoading}
                            variant="ghost"
                            className="text-red-400 hover:text-red-500 hover:bg-transparent px-0 text-sm font-semibold"
                        >
                            Delete Server
                        </Button>
                        <Button
                            className="bg-indigo-500 text-white hover:bg-indigo-600 rounded-[3px] font-semibold flex items-center gap-2 px-6"
                            disabled={isLoading || !name.trim()}
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

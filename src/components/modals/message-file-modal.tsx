"use client";

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
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { X } from "lucide-react";
import { useState } from "react";

interface MessageFileModalProps {
    apiUrl: string;
    query: Record<string, any>;
    isOpen: boolean;
    onClose: () => void;
}

export const MessageFileModal = ({ apiUrl, query, isOpen, onClose }: MessageFileModalProps) => {
    const router = useRouter();
    const [fileUrl, setFileUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async () => {
        if (!fileUrl) return;

        try {
            setIsLoading(true);
            const qs = new URLSearchParams(query as Record<string, string>).toString();
            await axios.post(`${apiUrl}?${qs}`, {
                content: fileUrl,
                fileUrl: fileUrl,
            });

            handleClose();
        } catch (error) {
            console.error("Failed to send file:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFileUrl("");
        onClose();
        router.refresh();
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md bg-[#313338] border-none text-white p-0 overflow-hidden">
                <DialogHeader className="pt-8 px-6 relative">
                    <button
                        onClick={handleClose}
                        className="absolute right-4 top-4 text-zinc-400 hover:text-white transition rounded-full hover:bg-zinc-700/50 p-1"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <DialogTitle className="text-2xl text-center font-bold">
                        Add an attachment
                    </DialogTitle>
                    <DialogDescription className="text-center text-zinc-400">
                        Send a file as a message
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6">
                    <div className="flex items-center justify-center text-center">
                        <FileUpload
                            endpoint="messageFile"
                            value={fileUrl}
                            onChange={(url) => {
                                if (url) setFileUrl(url);
                            }}
                        />
                    </div>
                </div>

                <DialogFooter className="bg-[#2B2D31] px-6 py-4">
                    <Button
                        type="button"
                        onClick={onSubmit}
                        disabled={isLoading || !fileUrl}
                        className="bg-indigo-500 text-white hover:bg-indigo-500/90 w-full font-semibold"
                    >
                        {isLoading ? "Sending..." : "Send"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

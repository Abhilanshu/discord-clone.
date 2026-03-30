"use client";

import { UploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import Image from "next/image";

interface FileUploadProps {
    onChange: (url?: string) => void;
    value: string;
    endpoint: keyof OurFileRouter;
}

export const FileUpload = ({ onChange, value, endpoint }: FileUploadProps) => {
    const fileType = value?.split(".").pop();

    if (value && fileType !== "pdf") {
        return (
            <div className="relative h-20 w-20">
                <Image
                    fill
                    src={value}
                    alt="Upload"
                    className="rounded-full object-cover"
                />
                <button
                    onClick={() => onChange("")}
                    className="bg-red-500 text-white p-1 rounded-full absolute -top-1 -right-1 shadow-sm hover:bg-red-600 transition"
                    type="button"
                >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <UploadDropzone<OurFileRouter, typeof endpoint>
            endpoint={endpoint}
            onClientUploadComplete={(res) => {
                onChange(res?.[0].ufsUrl);
            }}
            onUploadError={(error: Error) => {
                console.error("Upload error:", error);
            }}
            appearance={{
                container: "border-2 border-dashed border-zinc-600 bg-[#1e1f22] rounded-lg p-4",
                label: "text-zinc-400",
                allowedContent: "text-zinc-500 text-xs",
                button: "bg-indigo-500 text-white text-sm px-4 py-2 rounded hover:bg-indigo-600 transition ut-uploading:bg-indigo-400",
            }}
        />
    );
};

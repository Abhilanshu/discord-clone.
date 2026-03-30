"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Next.js Fatal Crash Caught:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center h-full bg-zinc-900 text-white p-8 overflow-y-auto">
            <h2 className="text-3xl font-bold text-red-500 mb-4">Something went wrong!</h2>
            <div className="bg-black p-4 rounded-md w-full max-w-3xl overflow-x-auto text-sm text-red-400 font-mono mb-6">
                {error.message}
                <br /><br />
                {error.stack}
            </div>
            <button
                className="bg-indigo-500 hover:bg-indigo-600 px-6 py-2 rounded-md font-semibold transition"
                onClick={() => reset()}
            >
                Try again
            </button>
        </div>
    );
}

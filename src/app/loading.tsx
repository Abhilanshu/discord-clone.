"use client";

import { Loader2 } from "lucide-react";

const LoadingPage = () => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-[#313338]">
      <Loader2 className="h-10 w-10 text-zinc-500 animate-spin my-4" />
      <p className="text-zinc-500 text-sm">Synchronizing your profile...</p>
    </div>
  );
}

export default LoadingPage;
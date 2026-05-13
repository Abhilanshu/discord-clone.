import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

export const NavigationSidebar = async () => {
    const { userId } = await auth();

    if (!userId) {
        return redirect("/sign-in");
    }

    let profile = null;
    let servers: any[] = [];

    try {
        profile = await db.user.findUnique({
            where: { userId }
        });

        if (profile) {
            servers = await db.server.findMany({
                where: {
                    members: {
                        some: {
                            profileId: profile.id
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error("[NAVIGATION_SIDEBAR] Database error:", error);
    }

    if (!profile) {
        return redirect("/sign-in");
    }

    return (
        <div className="space-y-4 flex flex-col items-center h-full text-primary w-full bg-[#1E1F22] py-3">
            {/* Direct Messages Icon Button */}
            <div className="relative group flex items-center justify-center w-full">
                <div className="absolute left-0 bg-white rounded-r-full transition-all w-[4px] h-[8px] group-hover:h-[20px]" />
                <Link href="/" className="group flex items-center justify-center w-[48px] h-[48px] rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-indigo-500 transition-all duration-200">
                    <div className="relative w-6 h-6">
                        <svg className="w-6 h-6 text-zinc-400 group-hover:text-white transition" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 22a10 10 0 1 0-8.45-4.64c.13.19.4.12.66-.08l2.64-2.03a11.08 11.08 0 0 1 5.15-1.25h.01c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12a9.98 9.98 0 0 0 4.14 8.08c-.28.32-1.3 1.34-1.77 1.6-.33.15-.59-.06-.5-.41l.73-2.91A10 10 0 0 0 12 22z" />
                        </svg>
                    </div>
                </Link>
            </div>

            <div className="w-8 h-[2px] bg-[#2B2D31] rounded-full mx-auto" />

            {/* Render User's Joined Servers */}
            <div className="flex-1 w-full space-y-4 flex flex-col items-center scrollbar-hide overflow-y-auto">
                {servers.map((server) => (
                    <div key={server.id} className="mb-4 relative group flex justify-center w-full">
                        <div className="absolute left-0 bg-white rounded-r-full transition-all w-[4px] h-[8px] group-hover:h-[20px] top-1/2 -translate-y-1/2" />
                        <Link href={`/servers/${server.id}`} className="group relative flex items-center justify-center w-[48px] h-[48px] rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-indigo-500 transition-all duration-200 overflow-hidden text-sm font-semibold text-zinc-400 hover:text-white">
                            {server.imageUrl ? (
                                <Image
                                    fill
                                    src={server.imageUrl}
                                    alt="Channel"
                                />
                            ) : (
                                server.name.charAt(0).toUpperCase()
                            )}
                        </Link>
                    </div>
                ))}

                {/* Add Server Button */}
                <div className="mb-4 relative group flex justify-center w-full">
                    <div className="absolute left-0 bg-white rounded-r-full transition-all w-[4px] h-[8px] group-hover:h-[20px] top-1/2 -translate-y-1/2" />
                    <Link href={`/servers/new`} className="group flex items-center justify-center w-[48px] h-[48px] rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-emerald-500 transition-all duration-200">
                        <svg className="w-6 h-6 text-emerald-500 group-hover:text-white transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </Link>
                </div>
            </div>

            <div className="pb-3 mt-auto flex items-center flex-col gap-y-4">
                <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                        elements: {
                            avatarBox: "h-[48px] w-[48px]"
                        }
                    }}
                />
            </div>
        </div>
    );
}

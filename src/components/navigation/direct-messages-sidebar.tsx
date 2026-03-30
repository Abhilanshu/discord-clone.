import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import Link from "next/link";
import { Search } from "lucide-react";
import { UserArea } from "@/components/navigation/user-area";

export const DirectMessagesSidebar = async () => {
    const { userId } = await auth();

    if (!userId) {
        return redirect("/sign-in");
    }

    const profile = await db.user.findUnique({
        where: { userId }
    });

    if (!profile) {
        return redirect("/");
    }

    // Find all conversations where this user is either memberOne or memberTwo
    const conversations = await db.conversation.findMany({
        where: {
            OR: [
                { memberOneId: profile.id },
                { memberTwoId: profile.id }
            ]
        },
        include: {
            memberOne: true,
            memberTwo: true
        }
    });

    // Deduplicate conversations: If two users share multiple servers, they have multiple Conversation records.
    // We only want to display ONE global DM context per unique Profile ID.
    const uniqueConversations = conversations.filter((convo, index, self) => {
        const otherProfileId = convo.memberOneId === profile.id ? convo.memberTwo.id : convo.memberOne.id;
        return index === self.findIndex((c) => {
            const otherId = c.memberOneId === profile.id ? c.memberTwo.id : c.memberOne.id;
            return otherId === otherProfileId;
        });
    });

    return (
        <div className="flex flex-col h-full text-primary w-full bg-[#2B2D31]">
            <div className="h-12 flex items-center px-3 border-b border-[#1E1F22] shadow-sm">
                <button
                    className="w-full text-left bg-[#1E1F22] text-zinc-400 px-2 py-1.5 rounded-sm text-sm font-medium flex items-center transition"
                >
                    Find or start a conversation
                </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-3 pl-2">
                <div className="space-y-[2px]">
                    <div className="flex items-center w-[calc(100%-8px)] px-2 py-[10px] group rounded-md hover:bg-zinc-700/50 transition cursor-pointer mb-4">
                        <div className="flex items-center gap-x-4">
                            <div className="text-zinc-400 group-hover:text-zinc-300 transition">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                                </svg>
                            </div>
                            <p className="font-semibold text-[15px] text-zinc-300 group-hover:text-zinc-200 transition">
                                Friends
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-2 pt-2 mb-2 pb-1">
                        <p className="text-xs font-semibold text-zinc-500 uppercase hover:text-zinc-300 transition cursor-pointer">
                            Direct Messages
                        </p>
                        <button
                            className="text-zinc-500 hover:text-zinc-300 transition"
                            title="Create DM"
                        >
                            <span className="text-lg font-light leading-none">+</span>
                        </button>
                    </div>

                    {uniqueConversations.map((convo) => {
                        const otherMember = convo.memberOneId === profile.id ? convo.memberTwo : convo.memberOne;

                        return (
                            <Link key={convo.id} href={`/direct-messages/${convo.id}`} className="flex items-center w-[calc(100%-8px)] px-2 py-1.5 group rounded-md hover:bg-zinc-700/50 transition cursor-pointer">
                                <div className="relative w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0 mr-3">
                                    {otherMember.name[0]?.toUpperCase()}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-zinc-500 rounded-full border-2 border-[#2b2d31]" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="font-medium text-sm text-zinc-300 group-hover:text-zinc-200 transition">
                                        {otherMember.name}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <UserArea profileName={profile.name} profileImageUrl={profile.imageUrl} />
        </div>
    );
}

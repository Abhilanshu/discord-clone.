import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MediaRoom } from "@/components/media-room";
import { ChatArea } from "@/components/chat/chat-area";

const ChannelIdPage = async ({
    params,
}: {
    params: Promise<{ serverId: string; channelId: string }>;
}) => {
    const { serverId, channelId } = await params;
    const { userId } = await auth();

    if (!userId) {
        return redirect("/sign-in");
    }

    let profile = null;
    let channel = null;
    let member = null;

    try {
        profile = await db.user.findUnique({ where: { userId } });

        if (profile) {
            channel = await db.channel.findUnique({ where: { id: channelId } });

            if (channel) {
                member = await db.member.findFirst({
                    where: { serverId, profileId: profile.id },
                    include: { profile: true },
                });
            }
        }
    } catch (error) {
        console.error("[CHANNEL_PAGE] Database error:", error);
    }

    if (!profile) return redirect("/sign-in");
    if (!channel) return redirect(`/servers/${serverId}`);
    if (!member) return redirect("/");

    return (
        <div className="flex flex-col h-full bg-[#313338]">
            <div className="h-12 flex items-center px-4 border-b border-zinc-800 shadow-sm">
                {channel.type === "TEXT" ? (
                    <svg className="w-5 h-5 text-zinc-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 text-zinc-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-2.464a5 5 0 010-7.072" />
                    </svg>
                )}
                <h2 className="text-white font-semibold">{channel.name}</h2>
                {channel.type !== "TEXT" && (
                    <span className="ml-2 text-xs text-zinc-500 uppercase">
                        {channel.type === "AUDIO" ? "Voice Channel" : "Video Channel"}
                    </span>
                )}
            </div>

            {channel.type === "TEXT" ? (
                <ChatArea
                    channelId={channelId}
                    serverId={serverId}
                    channelName={channel.name}
                    currentMemberId={member.id}
                    currentMemberRole={member.role}
                    currentMemberName={member.profile.name}
                    apiUrl="/api/messages"
                    socketUrl="/api/socket/messages"
                    socketQuery={{
                        channelId: channel.id,
                        serverId: channel.serverId,
                    }}
                    paramKey="channelId"
                    paramValue={channel.id}
                />
            ) : (
                <MediaRoom
                    chatId={channel.id}
                    video={channel.type === "VIDEO"}
                    audio={true}
                    profile={profile}
                />
            )}
        </div>
    );
};

export default ChannelIdPage;

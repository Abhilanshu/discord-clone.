import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const ServerIdPage = async ({
    params,
}: {
    params: Promise<{ serverId: string }>;
}) => {
    const { serverId } = await params;
    const { userId } = await auth();

    if (!userId) {
        return redirect("/sign-in");
    }

    let profile = null;
    let server = null;

    try {
        profile = await db.user.findUnique({ where: { userId } });

        if (profile) {
            server = await db.server.findUnique({
                where: {
                    id: serverId,
                    members: { some: { profileId: profile.id } }
                },
                include: {
                    channels: { orderBy: { createdAt: "asc" }, take: 1 }
                }
            });
        }
    } catch (error) {
        console.error("[SERVER_PAGE] Database error:", error);
    }

    if (!profile) return redirect("/sign-in");

    const generalChannel = server?.channels[0];
    if (generalChannel) {
        return redirect(`/servers/${serverId}/channels/${generalChannel.id}`);
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-400">
            <h2 className="text-2xl font-bold mb-2">Welcome to your server!</h2>
            <p className="text-sm">Select a channel to start chatting.</p>
        </div>
    );
};

export default ServerIdPage;

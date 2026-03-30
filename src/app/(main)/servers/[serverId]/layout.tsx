import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ServerSidebar } from "@/components/server/server-sidebar";

const ServerIdLayout = async ({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ serverId: string }>;
}) => {
    const { serverId } = await params;
    const { userId } = await auth();

    if (!userId) {
        return redirect("/sign-in");
    }

    const profile = await db.user.findUnique({
        where: { userId }
    });

    if (!profile) {
        return redirect("/sign-in");
    }

    const server = await db.server.findUnique({
        where: {
            id: serverId,
            members: {
                some: {
                    profileId: profile.id
                }
            }
        },
        include: {
            channels: {
                orderBy: { createdAt: "asc" }
            },
            members: {
                include: { profile: true },
                orderBy: { role: "asc" }
            }
        }
    });

    if (!server) {
        return redirect("/");
    }

    // Find current user's role
    const currentMember = server.members.find(m => m.profile.userId === userId);
    const profileRole = currentMember?.role || "GUEST";

    return (
        <div className="h-full">
            {/* Server Sidebar */}
            <div className="hidden md:flex h-full w-60 z-20 flex-col fixed inset-y-0 bg-[#2b2d31]">
                <ServerSidebar
                    server={{
                        id: server.id,
                        name: server.name,
                        imageUrl: server.imageUrl,
                        inviteCode: server.inviteCode,
                        channels: server.channels.map(ch => ({
                            id: ch.id,
                            name: ch.name,
                            type: ch.type,
                        })),
                        members: server.members.map(m => ({
                            id: m.id,
                            role: m.role,
                            profile: {
                                id: m.profile.id,
                                userId: m.profile.userId,
                                name: m.profile.name,
                                imageUrl: m.profile.imageUrl,
                            },
                        })),
                    }}
                    profileName={profile.name}
                    profileRole={profileRole}
                />
            </div>
            {/* Main content */}
            <main className="h-full md:pl-60">
                {children}
            </main>
        </div>
    );
};

export default ServerIdLayout;


import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { MemberRole } from "@prisma/client";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ channelId: string }> }
) {
    try {
        const { userId } = await auth();
        const { channelId } = await params;
        const { searchParams } = new URL(req.url);
        const serverId = searchParams.get("serverId");

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!serverId) {
            return new NextResponse("Server ID missing", { status: 400 });
        }

        const profile = await db.user.findUnique({
            where: { userId }
        });

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Prevent deleting 'general' channel
        const channel = await db.channel.findUnique({
            where: { id: channelId }
        });

        if (channel?.name === "general") {
            return new NextResponse("Cannot delete 'general' channel", { status: 400 });
        }

        const server = await db.server.update({
            where: {
                id: serverId,
                members: {
                    some: {
                        profileId: profile.id,
                        role: { in: [MemberRole.ADMIN, MemberRole.MODERATOR] }
                    }
                }
            },
            data: {
                channels: {
                    delete: { id: channelId }
                }
            }
        });

        return NextResponse.json(server);
    } catch (error) {
        console.error("[CHANNEL_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ channelId: string }> }
) {
    try {
        const { userId } = await auth();
        const { channelId } = await params;
        const { name, type } = await req.json();
        const { searchParams } = new URL(req.url);
        const serverId = searchParams.get("serverId");

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!serverId) {
            return new NextResponse("Server ID missing", { status: 400 });
        }

        if (name === "general") {
            return new NextResponse("Channel name cannot be 'general'", { status: 400 });
        }

        const profile = await db.user.findUnique({
            where: { userId }
        });

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const server = await db.server.update({
            where: {
                id: serverId,
                members: {
                    some: {
                        profileId: profile.id,
                        role: { in: [MemberRole.ADMIN, MemberRole.MODERATOR] }
                    }
                }
            },
            data: {
                channels: {
                    update: {
                        where: { id: channelId },
                        data: { name, type }
                    }
                }
            }
        });

        return NextResponse.json(server);
    } catch (error) {
        console.error("[CHANNEL_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

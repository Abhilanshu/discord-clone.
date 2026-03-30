import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { MemberRole } from "@prisma/client";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ messageId: string }> }
) {
    try {
        const { userId } = await auth();
        const { messageId } = await params;
        const { searchParams } = new URL(req.url);
        const channelId = searchParams.get("channelId");
        const serverId = searchParams.get("serverId");

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!channelId || !serverId) {
            return new NextResponse("Missing params", { status: 400 });
        }

        const profile = await db.user.findUnique({
            where: { userId }
        });

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const server = await db.server.findFirst({
            where: {
                id: serverId,
                members: {
                    some: { profileId: profile.id }
                }
            },
            include: { members: true }
        });

        if (!server) {
            return new NextResponse("Server not found", { status: 404 });
        }

        const member = server.members.find(m => m.profileId === profile.id);

        if (!member) {
            return new NextResponse("Member not found", { status: 404 });
        }

        const message = await db.message.findFirst({
            where: { id: messageId, channelId },
            include: { member: { include: { profile: true } } }
        });

        if (!message || message.deleted) {
            return new NextResponse("Message not found", { status: 404 });
        }

        const isMessageOwner = message.memberId === member.id;
        const isAdmin = member.role === MemberRole.ADMIN;
        const isModerator = member.role === MemberRole.MODERATOR;
        const canModify = isMessageOwner || isAdmin || isModerator;

        if (!canModify) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Soft delete
        const updatedMessage = await db.message.update({
            where: { id: messageId },
            data: {
                fileUrl: null,
                content: "This message has been deleted.",
                deleted: true,
            },
            include: { member: { include: { profile: true } } }
        });

        return NextResponse.json(updatedMessage);
    } catch (error) {
        console.error("[MESSAGE_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ messageId: string }> }
) {
    try {
        const { userId } = await auth();
        const { messageId } = await params;
        const { content } = await req.json();
        const { searchParams } = new URL(req.url);
        const channelId = searchParams.get("channelId");
        const serverId = searchParams.get("serverId");

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!channelId || !serverId) {
            return new NextResponse("Missing params", { status: 400 });
        }

        const profile = await db.user.findUnique({
            where: { userId }
        });

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const server = await db.server.findFirst({
            where: {
                id: serverId,
                members: { some: { profileId: profile.id } }
            },
            include: { members: true }
        });

        if (!server) {
            return new NextResponse("Server not found", { status: 404 });
        }

        const member = server.members.find(m => m.profileId === profile.id);

        if (!member) {
            return new NextResponse("Member not found", { status: 404 });
        }

        const message = await db.message.findFirst({
            where: { id: messageId, channelId },
        });

        if (!message || message.deleted) {
            return new NextResponse("Message not found", { status: 404 });
        }

        // Only owner can edit
        if (message.memberId !== member.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const updatedMessage = await db.message.update({
            where: { id: messageId },
            data: { content },
            include: { member: { include: { profile: true } } }
        });

        return NextResponse.json(updatedMessage);
    } catch (error) {
        console.error("[MESSAGE_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

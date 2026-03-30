import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { MemberRole, ChannelType } from "@prisma/client";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        const { name, type } = await req.json();
        const { searchParams } = new URL(req.url);
        const serverId = searchParams.get("serverId");

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        const { success } = rateLimit(ip, { windowMs: 60000, max: 10 }); // 10 channels per minute
        if (!success) {
            return new NextResponse("Too Many Requests", { status: 429 });
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
                    create: {
                        profileId: profile.id,
                        name,
                        type: type || ChannelType.TEXT,
                    }
                }
            }
        });

        return NextResponse.json(server);
    } catch (error) {
        console.error("[CHANNELS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

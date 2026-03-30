import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { MemberRole } from "@prisma/client";
import { rateLimit } from "@/lib/rate-limit";
import * as z from "zod";

const serverSchema = z.object({
    name: z.string().min(1, "Server name is required").max(100, "Server name is too long").trim(),
    imageUrl: z.string().url("Valid image URL is required").optional().or(z.literal("")),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = serverSchema.safeParse(body);

        if (!validation.success) {
            return new NextResponse("Invalid input data", { status: 400 });
        }

        const { name, imageUrl } = validation.data;
        const user = await currentUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        const { success } = rateLimit(ip, { windowMs: 60000, max: 5 }); // 5 servers per minute
        if (!success) {
            return new NextResponse("Too Many Requests", { status: 429 });
        }

        // Find or create profile
        let profile = await db.user.findUnique({
            where: { userId: user.id }
        });

        if (!profile) {
            profile = await db.user.create({
                data: {
                    userId: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    imageUrl: user.imageUrl,
                    email: user.emailAddresses[0].emailAddress
                }
            });
        }

        // Create server with default "general" channel and creator as ADMIN
        const server = await db.server.create({
            data: {
                name,
                imageUrl: imageUrl || user.imageUrl,
                inviteCode: uuidv4(),
                profileId: profile.id,
                channels: {
                    create: [
                        { name: "general", profileId: profile.id }
                    ]
                },
                members: {
                    create: [
                        { profileId: profile.id, role: MemberRole.ADMIN }
                    ]
                }
            }
        });

        return NextResponse.json(server);
    } catch (error) {
        console.error("[SERVERS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

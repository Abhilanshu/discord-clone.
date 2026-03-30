import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ serverId: string }> }
) {
    try {
        const { userId } = await auth();
        const { serverId } = await params;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const profile = await db.user.findUnique({
            where: { userId }
        });

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Check if already a member
        const existingServer = await db.server.findFirst({
            where: {
                id: serverId,
                members: {
                    some: { profileId: profile.id }
                }
            }
        });

        if (existingServer) {
            return NextResponse.json(existingServer);
        }

        // Add user as member
        const server = await db.server.update({
            where: { id: serverId },
            data: {
                members: {
                    create: [{ profileId: profile.id }]
                }
            }
        });

        return NextResponse.json(server);
    } catch (error) {
        console.error("[SERVER_MEMBERS_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

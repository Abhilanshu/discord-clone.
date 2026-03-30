import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import * as z from "zod";

const serverSchema = z.object({
    name: z.string().min(1, "Server name is required").max(100, "Server name is too long").trim().optional(),
    imageUrl: z.string().url("Valid image URL is required").optional().or(z.literal("")),
});

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ serverId: string }> }
) {
    try {
        const { userId } = await auth();
        const { serverId } = await params;
        const body = await req.json();

        const validation = serverSchema.safeParse(body);
        if (!validation.success) {
            return new NextResponse("Invalid input data", { status: 400 });
        }

        const { name, imageUrl } = validation.data;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
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
                profileId: profile.id, // Only server owner can edit
            },
            data: { name, imageUrl }
        });

        return NextResponse.json(server);
    } catch (error) {
        console.error("[SERVER_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
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

        const server = await db.server.delete({
            where: {
                id: serverId,
                profileId: profile.id, // Only server owner can delete
            }
        });

        return NextResponse.json(server);
    } catch (error) {
        console.error("[SERVER_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

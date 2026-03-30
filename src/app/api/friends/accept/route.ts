import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        const body = await req.json();
        const { friendshipId } = body;

        if (!userId) return new NextResponse("Unauthorized", { status: 401 });
        if (!friendshipId) return new NextResponse("Friendship ID Missing", { status: 400 });

        const currentUser = await db.user.findUnique({
            where: { userId }
        });

        if (!currentUser) return new NextResponse("User not found", { status: 404 });

        const friendship = await db.friendship.update({
            where: {
                id: friendshipId,
                profileTwoId: currentUser.id // Must be the receiver to accept
            },
            data: {
                status: "ACCEPTED"
            }
        });

        return NextResponse.json(friendship);
    } catch (error) {
        console.error("[FRIEND_ACCEPT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

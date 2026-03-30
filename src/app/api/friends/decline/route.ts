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

        // User can declare an outgoing request (cancel) or incoming (decline)
        const friendship = await db.friendship.findUnique({
            where: { id: friendshipId }
        });

        if (!friendship) return new NextResponse("Friendship not found", { status: 404 });

        if (friendship.profileOneId !== currentUser.id && friendship.profileTwoId !== currentUser.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const deletedFriendship = await db.friendship.delete({
            where: { id: friendshipId }
        });

        return NextResponse.json(deletedFriendship);
    } catch (error) {
        console.error("[FRIEND_DECLINE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

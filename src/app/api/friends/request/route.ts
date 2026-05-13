import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        const { profileId } = await req.json();

        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const currentUser = await db.user.findUnique({ where: { userId } });
        if (!currentUser) return new NextResponse("Unauthorized", { status: 401 });

        if (currentUser.id === profileId) return new NextResponse("Cannot request yourself", { status: 400 });

        const existingFriendship = await db.friendship.findFirst({
            where: {
                OR: [
                    { profileOneId: currentUser.id, profileTwoId: profileId },
                    { profileOneId: profileId, profileTwoId: currentUser.id }
                ]
            }
        });

        if (existingFriendship) {
            if (existingFriendship.status === "PENDING" && existingFriendship.profileTwoId === currentUser.id) {
                await db.friendship.update({
                    where: { id: existingFriendship.id },
                    data: { status: "ACCEPTED" }
                });
                return NextResponse.json({ status: "ACCEPTED" });
            }
            return NextResponse.json({ status: "EXISTING" }); 
        }

        const friendship = await db.friendship.create({
            data: {
                profileOneId: currentUser.id,
                profileTwoId: profileId,
                status: "PENDING"
            }
        });

        return NextResponse.json(friendship);

    } catch (error) {
        console.error("[FRIEND_REQUEST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

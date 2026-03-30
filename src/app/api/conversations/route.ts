import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateConversation } from "@/lib/conversation";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        const { memberTwoId } = await req.json();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!memberTwoId) {
            return new NextResponse("Member Two ID missing", { status: 400 });
        }

        const profile = await db.user.findUnique({
            where: { userId }
        });

        if (!profile) {
            return new NextResponse("Profile not found", { status: 404 });
        }

        const conversation = await getOrCreateConversation(profile.id, memberTwoId);

        if (!conversation) {
            return new NextResponse("Failed to create conversation", { status: 500 });
        }

        return NextResponse.json(conversation);
    } catch (error) {
        console.error("[CONVERSATIONS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

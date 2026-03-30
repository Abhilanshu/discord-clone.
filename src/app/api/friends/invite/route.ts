import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        const { searchParams } = new URL(req.url);
        const targetId = searchParams.get("targetId");

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!targetId) {
            return new NextResponse("Target ID missing", { status: 400 });
        }

        const profile = await db.user.findUnique({
            where: { userId }
        });

        if (!profile) {
            return new NextResponse("Profile not found", { status: 404 });
        }

        if (profile.id === targetId) {
            return new NextResponse("Cannot add yourself as a friend", { status: 400 });
        }

        // Check if friendship already exists
        const existingFriendship = await db.friendship.findFirst({
            where: {
                OR: [
                    {
                        profileOneId: profile.id,
                        profileTwoId: targetId
                    },
                    {
                        profileOneId: targetId,
                        profileTwoId: profile.id
                    }
                ]
            }
        });

        if (existingFriendship) {
            // Even if friendship exists, ensure a conversation exists too
            await ensureConversationExists(profile.id, targetId);
            return NextResponse.json({ message: "Already friends", friendship: existingFriendship });
        }

        // Auto-accept friendships for instant connection
        const friendship = await db.friendship.create({
            data: {
                profileOneId: targetId,
                profileTwoId: profile.id,
                status: "ACCEPTED"
            }
        });

        // Create a DM conversation so both users appear in each other's sidebar
        await ensureConversationExists(profile.id, targetId);

        return NextResponse.json({ message: "Friend added!", friendship });
    } catch (error) {
        console.error("[FRIENDS_INVITE_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// Helper: create a Conversation between two users if one doesn't exist
async function ensureConversationExists(profileOneId: string, profileTwoId: string) {
    // Check if conversation already exists (in either direction)
    const existing = await db.conversation.findFirst({
        where: {
            OR: [
                { memberOneId: profileOneId, memberTwoId: profileTwoId },
                { memberOneId: profileTwoId, memberTwoId: profileOneId }
            ]
        }
    });

    if (existing) return existing;

    // Create a new conversation
    const conversation = await db.conversation.create({
        data: {
            memberOneId: profileOneId,
            memberTwoId: profileTwoId
        }
    });

    return conversation;
}

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/calls/history — Fetch call history for current user
export async function GET(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const profile = await db.user.findUnique({
            where: { userId }
        });

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        // Get last 50 calls involving this user
        const calls = await db.callNotification.findMany({
            where: {
                OR: [
                    { callerId: profile.id },
                    { receiverId: profile.id }
                ]
            },
            orderBy: { createdAt: "desc" },
            take: 50,
            include: {
                caller: {
                    select: { id: true, name: true, imageUrl: true }
                },
                receiver: {
                    select: { id: true, name: true, imageUrl: true }
                }
            }
        });

        // Format for the client
        const formattedCalls = calls.map(call => {
            const isOutgoing = call.callerId === profile.id;
            const otherUser = isOutgoing ? call.receiver : call.caller;

            return {
                id: call.id,
                otherUser: {
                    id: otherUser.id,
                    name: otherUser.name,
                    imageUrl: otherUser.imageUrl,
                },
                conversationId: call.conversationId,
                chatId: call.chatId,
                type: call.type,
                status: call.status,
                isOutgoing,
                createdAt: call.createdAt,
            };
        });

        return NextResponse.json(formattedCalls);
    } catch (error) {
        console.error("[CALL_HISTORY_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/calls — Initiate a call (creates a RINGING notification)
export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { receiverProfileId, conversationId, chatId, type } = body;

        const caller = await db.user.findUnique({ where: { userId } });
        if (!caller) {
            return NextResponse.json({ error: "Caller not found" }, { status: 404 });
        }

        // Cancel any existing RINGING calls from this caller
        await db.callNotification.updateMany({
            where: { callerId: caller.id, status: "RINGING" },
            data: { status: "CANCELLED" }
        });

        // Create new call notification
        const call = await db.callNotification.create({
            data: {
                callerId: caller.id,
                receiverId: receiverProfileId,
                conversationId,
                chatId,
                type,
                callerName: caller.name,
                callerImageUrl: caller.imageUrl,
                callerUserId: caller.userId,
                status: "RINGING",
            }
        });

        return NextResponse.json(call);
    } catch (error) {
        console.error("[CALLS_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// GET /api/calls — Check for incoming RINGING calls for the current user
export async function GET(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const profile = await db.user.findUnique({ where: { userId } });
        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        // Find active RINGING calls for this user
        const incomingCall = await db.callNotification.findFirst({
            where: {
                receiverId: profile.id,
                status: "RINGING",
                // Only show calls from the last 30 seconds
                createdAt: { gte: new Date(Date.now() - 30000) }
            },
            include: { caller: true },
            orderBy: { createdAt: "desc" }
        });

        if (incomingCall) {
            return NextResponse.json({
                hasIncomingCall: true,
                call: {
                    id: incomingCall.id,
                    profileId: incomingCall.caller.id,
                    userId: incomingCall.callerUserId,
                    name: incomingCall.callerName,
                    imageUrl: incomingCall.callerImageUrl,
                    conversationId: incomingCall.conversationId,
                    chatId: incomingCall.chatId,
                    type: incomingCall.type,
                }
            });
        }

        return NextResponse.json({ hasIncomingCall: false });
    } catch (error) {
        console.error("[CALLS_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// PATCH /api/calls — Accept or decline a call
export async function PATCH(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { callId, action } = body; // action: "accept" | "decline" | "cancel"

        const status = action === "accept" ? "ACCEPTED" : action === "decline" ? "DECLINED" : "CANCELLED";

        const call = await db.callNotification.update({
            where: { id: callId },
            data: { status }
        });

        return NextResponse.json(call);
    } catch (error) {
        console.error("[CALLS_PATCH]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

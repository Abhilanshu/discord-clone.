import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/calls/[callId] — Check the status of a specific call (used by caller to poll for acceptance)
export async function GET(
    req: Request,
    { params }: { params: Promise<{ callId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { callId } = await params;

        const call = await db.callNotification.findUnique({
            where: { id: callId }
        });

        if (!call) {
            return NextResponse.json({ error: "Call not found" }, { status: 404 });
        }

        return NextResponse.json({ status: call.status });
    } catch (error) {
        console.error("[CALL_STATUS_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

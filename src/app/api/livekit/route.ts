import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const profile = await db.user.findUnique({
            where: { userId }
        });

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const room = searchParams.get("room");

        if (!room) {
            return new NextResponse("Missing room parameter", { status: 400 });
        }

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;

        if (!apiKey || !apiSecret) {
            return new NextResponse("LiveKit not configured", { status: 500 });
        }

        const at = new AccessToken(apiKey, apiSecret, {
            identity: profile.name,
            name: profile.name,
        });

        at.addGrant({
            room,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
        });

        const token = await at.toJwt();

        return NextResponse.json({ token });
    } catch (error) {
        console.error("[LIVEKIT_TOKEN]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

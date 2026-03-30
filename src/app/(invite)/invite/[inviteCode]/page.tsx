import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const InviteCodePage = async ({
    params,
}: {
    params: Promise<{ inviteCode: string }>;
}) => {
    const { inviteCode } = await params;
    const { userId, redirectToSignIn } = await auth();

    if (!userId) {
        return redirectToSignIn();
    }

    if (!inviteCode) {
        return redirect("/");
    }

    const profile = await db.user.findUnique({
        where: { userId }
    });

    if (!profile) {
        return redirect("/");
    }

    // Check if already a member of a server with this invite code
    const existingServer = await db.server.findFirst({
        where: {
            inviteCode: inviteCode,
            members: {
                some: { profileId: profile.id }
            }
        }
    });

    if (existingServer) {
        return redirect(`/servers/${existingServer.id}`);
    }

    // Join the server
    try {
        const server = await db.server.update({
            where: { inviteCode: inviteCode },
            data: {
                members: {
                    create: [{ profileId: profile.id }]
                }
            }
        });

        if (server) {
            return redirect(`/servers/${server.id}`);
        }
    } catch (error) {
        return redirect("/");
    }

    return redirect("/");
};

export default InviteCodePage;

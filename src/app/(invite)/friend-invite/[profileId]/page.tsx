import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { InviteClient } from "./invite-client";

const FriendInvitePage = async ({
    params,
}: {
    params: Promise<{ profileId: string }>;
}) => {
    const { profileId } = await params;
    const { userId, redirectToSignIn } = await auth();

    if (!userId) {
        return redirectToSignIn();
    }

    if (!profileId) {
        return redirect("/");
    }

    const currentUser = await db.user.findUnique({
        where: { userId }
    });

    if (!currentUser) return redirect("/");
    if (currentUser.id === profileId) return redirect("/");

    const inviter = await db.user.findUnique({
        where: { id: profileId }
    });

    if (!inviter) return redirect("/");

    return (
        <InviteClient 
            profileId={inviter.id}
            name={inviter.name}
            imageUrl={inviter.imageUrl}
        />
    );
};

export default FriendInvitePage;

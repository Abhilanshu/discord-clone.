import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

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

    if (!currentUser) {
        return redirect("/");
    }

    if (currentUser.id === profileId) {
        return redirect("/");
    }

    // Check if friendship exists
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
            // They invited me, I'm clicking their link -> Accept
            await db.friendship.update({
                where: { id: existingFriendship.id },
                data: { status: "ACCEPTED" }
            });
        }
        return redirect("/");
    }

    await db.friendship.create({
        data: {
            profileOneId: currentUser.id,
            profileTwoId: profileId,
            status: "PENDING"
        }
    });

    return redirect("/");
};

export default FriendInvitePage;

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { FriendsDashboard } from "@/components/chat/friends-dashboard";

export default async function DirectMessagesPage() {
    const { userId } = await auth();

    if (!userId) {
        return redirect("/sign-in");
    }

    const profile = await db.user.findUnique({
        where: { userId }
    });

    if (!profile) {
        return redirect("/");
    }

    // Fetch actual friendships
    const friendships = await db.friendship.findMany({
        where: {
            OR: [
                { profileOneId: profile.id },
                { profileTwoId: profile.id }
            ]
        },
        include: {
            profileOne: true,
            profileTwo: true
        }
    });

    const friendsList = friendships.map((f) => {
        const otherProfile = f.profileOneId === profile.id ? f.profileTwo : f.profileOne;
        const isIncoming = f.profileTwoId === profile.id && f.status === "PENDING";

        return {
            id: f.id,
            profileId: otherProfile.id,
            userId: otherProfile.userId,
            name: otherProfile.name,
            imageUrl: otherProfile.imageUrl,
            status: f.status === "ACCEPTED" ? "Offline" : "Pending", // Defaulting to Offline for now
            isIncoming
        };
    }) as any[];

    return (
        <FriendsDashboard
            profileId={profile.id}
            initialFriends={friendsList}
        />
    );
}

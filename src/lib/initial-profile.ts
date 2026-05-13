import { currentUser, auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export const initialProfile = async () => {
    const { userId } = await auth();

    if (!userId) {
        return null;
    }

    try {
        const profile = await db.user.findUnique({
            where: {
                userId
            }
        });

        if (profile) {
            return profile;
        }

        // Only fetch full user data when we need to create a new profile
        const user = await currentUser();

        if (!user) {
            return null;
        }

        const newProfile = await db.user.upsert({
            where: {
                userId: user.id
            },
            update: {},
            create: {
                userId: user.id,
                name: `${user.firstName} ${user.lastName}`,
                imageUrl: user.imageUrl,
                email: user.emailAddresses[0].emailAddress
            }
        });

        return newProfile;
    } catch (error) {
        console.error("[INITIAL_PROFILE] Database error:", error);
        return null;
    }
};

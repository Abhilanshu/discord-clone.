import { db } from "@/lib/db";

export const getOrCreateConversation = async (profileOneId: string, profileTwoId: string) => {
    let conversation = await findConversation(profileOneId, profileTwoId) || await findConversation(profileTwoId, profileOneId);

    if (!conversation) {
        conversation = await createNewConversation(profileOneId, profileTwoId);
    }

    return conversation;
}

const findConversation = async (profileOneId: string, profileTwoId: string) => {
    try {
        return await db.conversation.findFirst({
            where: {
                AND: [
                    { memberOneId: profileOneId },
                    { memberTwoId: profileTwoId },
                ]
            },
            include: {
                memberOne: true,
                memberTwo: true,
            }
        });
    } catch {
        return null;
    }
}

const createNewConversation = async (profileOneId: string, profileTwoId: string) => {
    try {
        return await db.conversation.create({
            data: {
                memberOneId: profileOneId,
                memberTwoId: profileTwoId,
            },
            include: {
                memberOne: true,
                memberTwo: true,
            }
        })
    } catch {
        return null;
    }
}

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ChatConversation } from "@/components/chat/chat-conversation";

const DirectMessageIdPage = async ({
    params,
}: {
    params: Promise<{ conversationId: string }>;
}) => {
    const { userId, redirectToSignIn } = await auth();
    const resolvedParams = await params;
    const { conversationId } = resolvedParams;

    if (!userId) {
        return redirectToSignIn();
    }

    let profile = null;
    let conversation = null;

    try {
        profile = await db.user.findUnique({ where: { userId } });

        if (profile) {
            conversation = await db.conversation.findUnique({
                where: { id: conversationId },
                include: { memberOne: true, memberTwo: true }
            });
        }
    } catch (error) {
        console.error("[DM_ID_PAGE] Database error:", error);
    }

    if (!profile) return redirect("/sign-in");
    if (!conversation) return redirect("/direct-messages");

    const currentMember = conversation.memberOne.id === profile.id
        ? conversation.memberOne
        : conversation.memberTwo;

    const otherMember = conversation.memberOne.id === profile.id
        ? conversation.memberTwo
        : conversation.memberOne;

    return (
        <ChatConversation
            conversationId={conversation.id}
            serverId={"direct-message"}
            otherMemberName={otherMember.name}
            otherMemberProfileId={otherMember.id}
            otherMemberUserId={otherMember.userId}
            otherMemberImageUrl={otherMember.imageUrl}
            currentMemberId={currentMember.id}
            currentMemberRole={"GUEST"}
            currentMemberName={currentMember.name}
            currentMemberProfileId={currentMember.id}
            currentMemberUserId={profile.userId}
            currentMemberImageUrl={currentMember.imageUrl}
            chatId={`dm-${conversation.id}`}
        />
    );
};

export default DirectMessageIdPage;

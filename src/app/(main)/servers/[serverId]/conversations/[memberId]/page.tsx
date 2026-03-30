import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getOrCreateConversation } from "@/lib/conversation";
import { ChatConversation } from "@/components/chat/chat-conversation";

const MemberIdPage = async ({
    params,
}: {
    params: Promise<{ serverId: string; memberId: string }>;
}) => {
    const { userId, redirectToSignIn } = await auth();
    const resolvedParams = await params;
    const { serverId, memberId } = resolvedParams;

    if (!userId) {
        return redirectToSignIn();
    }

    const profile = await db.user.findUnique({
        where: { userId }
    });

    if (!profile) {
        return redirect("/");
    }

    const currentMember = await db.member.findFirst({
        where: {
            serverId,
            profileId: profile.id,
        },
        include: {
            profile: true,
        },
    });

    if (!currentMember) {
        return redirect("/");
    }

    if (currentMember.id === memberId) {
        return redirect(`/servers/${serverId}`);
    }

    const otherMember = await db.member.findFirst({
        where: {
            id: memberId,
            serverId,
        },
        include: {
            profile: true,
        },
    });

    if (!otherMember) {
        return redirect(`/servers/${serverId}`);
    }

    const conversation = await getOrCreateConversation(profile.id, otherMember.profileId);

    if (!conversation) {
        return redirect(`/servers/${serverId}`);
    }

    const { memberOne, memberTwo } = conversation;

    return (
        <ChatConversation
            conversationId={conversation.id}
            serverId={serverId}
            otherMemberName={otherMember.profile.name}
            otherMemberProfileId={otherMember.profile.id}
            otherMemberUserId={otherMember.profile.userId}
            otherMemberImageUrl={otherMember.profile.imageUrl}
            currentMemberId={currentMember.id}
            currentMemberRole={currentMember.role}
            currentMemberName={profile.name}
            currentMemberProfileId={profile.id}
            currentMemberUserId={profile.userId}
            currentMemberImageUrl={profile.imageUrl}
            chatId={`dm-${conversation.id}`}
        />
    );
};

export default MemberIdPage;

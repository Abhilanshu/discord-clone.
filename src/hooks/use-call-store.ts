import { create } from "zustand";

export interface CallerInfo {
    profileId: string;
    userId: string;
    name: string;
    imageUrl: string;
    conversationId: string;
    chatId: string; // LiveKit room ID
    type: "audio" | "video";
    callId?: string; // database CallNotification ID
}

export interface CurrentProfileInfo {
    id: string;
    name: string;
    imageUrl: string;
}

interface CallStore {
    outgoingCall: CallerInfo | null;
    incomingCall: CallerInfo | null;
    activeCall: CallerInfo | null;
    currentProfile: CurrentProfileInfo | null;
    setOutgoingCall: (call: CallerInfo | null) => void;
    setIncomingCall: (call: CallerInfo | null) => void;
    setActiveCall: (call: CallerInfo | null) => void;
    setCurrentProfile: (profile: CurrentProfileInfo | null) => void;
}

export const useCallStore = create<CallStore>((set) => ({
    outgoingCall: null,
    incomingCall: null,
    activeCall: null,
    currentProfile: null,
    setOutgoingCall: (call) => set({ outgoingCall: call }),
    setIncomingCall: (call) => set({ incomingCall: call }),
    setActiveCall: (call) => set({ activeCall: call }),
    setCurrentProfile: (profile) => set({ currentProfile: profile }),
}));

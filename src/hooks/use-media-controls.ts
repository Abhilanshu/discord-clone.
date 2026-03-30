import { create } from "zustand";

interface MediaControlsStore {
    isMuted: boolean;
    isDeafened: boolean;
    toggleMute: () => void;
    toggleDeafen: () => void;
}

export const useMediaControls = create<MediaControlsStore>((set) => ({
    isMuted: false,
    isDeafened: false,
    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
    toggleDeafen: () => set((state) => {
        // If deafening, also mute. If undeafening, keep muted if it was already muted.
        const newDeafened = !state.isDeafened;
        return { 
            isDeafened: newDeafened,
            isMuted: newDeafened ? true : state.isMuted 
        };
    }),
}));

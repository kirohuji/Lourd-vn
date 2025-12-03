import { create } from 'zustand';

interface HotspotsStore {
    showHotspots: boolean;
    toggleHotspots: () => void;
    setShowHotspots: (show: boolean) => void;
}

const useHotspotsStore = create<HotspotsStore>((set) => ({
    showHotspots: false,
    toggleHotspots: () => set((state) => ({ showHotspots: !state.showHotspots })),
    setShowHotspots: (show: boolean) => set({ showHotspots: show }),
}));

export default useHotspotsStore;


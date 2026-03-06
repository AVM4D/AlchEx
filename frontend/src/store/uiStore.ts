import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  modalOpen: string | null;
  commandPaletteOpen: boolean;
  theme: 'dark';

  setSidebarOpen: (open: boolean) => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  modalOpen: null,
  commandPaletteOpen: false,
  theme: 'dark',

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openModal: (id) => set({ modalOpen: id }),
  closeModal: () => set({ modalOpen: null }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}));

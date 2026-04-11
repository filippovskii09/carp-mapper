import { create } from 'zustand';

interface ToastState {
  message: string | null;
  showToast: (message: string) => void;
  clearToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  showToast: (message: string) => set({ message }),
  clearToast: () => set({ message: null })
}));

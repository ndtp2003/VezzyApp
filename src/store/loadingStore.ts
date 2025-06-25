import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
}

interface LoadingActions {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  setLoadingMessage: (message?: string) => void;
}

export type LoadingStore = LoadingState & LoadingActions;

export const useLoadingStore = create<LoadingStore>((set) => ({
  // State
  isLoading: false,
  loadingMessage: undefined,

  // Actions
  showLoading: (message?: string) => {
    set({ isLoading: true, loadingMessage: message });
  },

  hideLoading: () => {
    set({ isLoading: false, loadingMessage: undefined });
  },

  setLoadingMessage: (message?: string) => {
    set({ loadingMessage: message });
  },
})); 

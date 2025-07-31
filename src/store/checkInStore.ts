import { create } from 'zustand';

interface CheckInState {
  checkInHistory: any[];
  qrCodeDetail: any | null;
  setCheckInHistoryRealtime: (history: any[]) => void;
  setQRCodeDetailRealtime: (detail: any) => void;
}

export const useCheckInStore = create<CheckInState>((set) => ({
  checkInHistory: [],
  qrCodeDetail: null,
  setCheckInHistoryRealtime: (history) => set({ checkInHistory: history }),
  setQRCodeDetailRealtime: (detail) => set({ qrCodeDetail: detail }),
})); 
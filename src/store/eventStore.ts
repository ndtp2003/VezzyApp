import { create } from 'zustand';
import { Event, TicketIssuedResponse, DashboardStats, SearchFilters, PaginationParams } from '../types';
import { apiService } from '../services/api';

interface EventState {
  assignedEvents: Event[];
  selectedEvent: Event | null;
  checkInHistory: TicketIssuedResponse[];
  dashboardStats: DashboardStats | null;
  isLoading: boolean;
  isCheckingIn: boolean;
  searchFilters: SearchFilters;
  pagination: PaginationParams;
  error: string | null;
}

interface EventActions {
  fetchAssignedEvents: (filters?: SearchFilters) => Promise<void>;
  selectEvent: (event: Event) => void;
  clearSelectedEvent: () => void;
  checkInByQR: (qrContent: string) => Promise<boolean>;
  fetchCheckInHistory: (eventId: string, pagination?: PaginationParams) => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  setSearchFilters: (filters: SearchFilters) => void;
  setPagination: (pagination: PaginationParams) => void;
  refreshEvents: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setCheckingIn: (checking: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export type EventStore = EventState & EventActions;

export const useEventStore = create<EventStore>((set, get) => ({
  // State
  assignedEvents: [],
  selectedEvent: null,
  checkInHistory: [],
  dashboardStats: null,
  isLoading: false,
  isCheckingIn: false,
  searchFilters: {},
  pagination: {
    page: 1,
    limit: 20,
    sortBy: 'startDate',
    sortOrder: 'desc',
  },
  error: null,

  // Actions
  fetchAssignedEvents: async (filters?: SearchFilters) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiService.getAssignedEvents(filters);
      
      if (response.flag) {
        set({
          assignedEvents: response.data,
          isLoading: false,
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch events',
      });
      throw error;
    }
  },

  selectEvent: (event: Event) => {
    set({ selectedEvent: event });
  },

  clearSelectedEvent: () => {
    set({ selectedEvent: null, checkInHistory: [] });
  },

  checkInByQR: async (qrContent: string) => {
    try {
      set({ isCheckingIn: true, error: null });
      
      const response = await apiService.checkInByQR({ qrContent });
      
      if (response.flag) {
        // Refresh dashboard stats after successful check-in
        get().fetchDashboardStats();
        
        // Refresh check-in history if we have a selected event
        const { selectedEvent } = get();
        if (selectedEvent) {
          get().fetchCheckInHistory(selectedEvent.eventId);
        }
        
        set({ isCheckingIn: false });
        return true;
      } else {
        set({ 
          isCheckingIn: false,
          error: response.message 
        });
        return false;
      }
    } catch (error) {
      set({
        isCheckingIn: false,
        error: error instanceof Error ? error.message : 'Check-in failed',
      });
      return false;
    }
  },

  fetchCheckInHistory: async (eventId: string, pagination?: PaginationParams) => {
    try {
      set({ isLoading: true, error: null });
      
      const paginationParams = pagination || get().pagination;
      const response = await apiService.getCheckinHistory(eventId, paginationParams);
      
      if (response.flag) {
        set({
          checkInHistory: response.data.data,
          pagination: {
            ...paginationParams,
            page: response.data.pagination.page,
          },
          isLoading: false,
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch check-in history',
      });
      throw error;
    }
  },

  fetchDashboardStats: async () => {
    try {
      const response = await apiService.getDashboardStats();
      
      if (response.flag) {
        set({ dashboardStats: response.data });
      } else {
        console.error('Failed to fetch dashboard stats:', response.message);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Don't set error state for dashboard stats as it's not critical
    }
  },

  setSearchFilters: (filters: SearchFilters) => {
    set({ searchFilters: filters });
  },

  setPagination: (pagination: PaginationParams) => {
    set({ pagination });
  },

  refreshEvents: async () => {
    const { searchFilters } = get();
    await get().fetchAssignedEvents(searchFilters);
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setCheckingIn: (checking: boolean) => {
    set({ isCheckingIn: checking });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },
})); 

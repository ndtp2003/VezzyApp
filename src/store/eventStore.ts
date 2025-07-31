import { create } from 'zustand';
import { apiService } from '../services/api';
import { Event, PaginatedData, PaginationParams, ApiResponse } from '../types';
import { handleApiError } from '../utils/errorHandler';

interface EventState {
  // Event data
  events: Event[];
  selectedEvent: Event | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  
  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  
  // Error state
  error: string | null;
  
  // Realtime dashboard/collaborator stats
  collaboratorStats?: any;
  
  // Actions
  loadEvents: (refresh?: boolean) => Promise<void>;
  loadMoreEvents: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  setSelectedEvent: (event: Event | null) => void;
  clearError: () => void;
  reset: () => void;
  setCollaboratorStats: (stats: any) => void;
}

const DEFAULT_PAGE_SIZE = 20;

export const useEventStore = create<EventState>((set, get) => ({
  // Initial state
  events: [],
  selectedEvent: null,
  currentPage: 1,
  totalPages: 0,
  totalItems: 0,
  hasNextPage: false,
  hasPreviousPage: false,
  isLoading: false,
  isLoadingMore: false,
  isRefreshing: false,
  error: null,
  collaboratorStats: undefined,

  // Load events with pagination
  loadEvents: async (refresh = false) => {
    const currentState = get();
    
    if (refresh) {
      set({ 
        isRefreshing: true, 
        error: null,
        currentPage: 1 
      });
    } else {
      set({ 
        isLoading: true, 
        error: null 
      });
    }

    try {
      const response: ApiResponse<Event[]> = await apiService.getAssignedEvents();
      
      if (response.flag) {
        set({
          events: response.data,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      set({
        isLoading: false,
        isRefreshing: false,
        error: errorMessage,
      });
    }
  },

  // Load more events (for pagination)
  loadMoreEvents: async () => {
    const currentState = get();
    
    if (!currentState.hasNextPage || currentState.isLoadingMore) {
      return;
    }

    set({ isLoadingMore: true, error: null });

    try {
      const pagination: PaginationParams = {
        page: currentState.currentPage + 1,
        pageSize: DEFAULT_PAGE_SIZE,
      };

      const response: ApiResponse<Event[]> = await apiService.getAssignedEvents();
      
      if (response.flag) {
        set({
          events: [...currentState.events, ...response.data],
          currentPage: currentState.currentPage + 1,
          isLoadingMore: false,
          error: null,
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      set({
        isLoadingMore: false,
        error: errorMessage,
      });
    }
  },

  // Refresh events
  refreshEvents: async () => {
    await get().loadEvents(true);
  },

  // Set selected event
  setSelectedEvent: (event: Event | null) => {
    set({ selectedEvent: event });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Reset store
  reset: () => {
    set({
      events: [],
      selectedEvent: null,
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      hasNextPage: false,
      hasPreviousPage: false,
      isLoading: false,
      isLoadingMore: false,
      isRefreshing: false,
      error: null,
      collaboratorStats: undefined,
    });
  },

  setCollaboratorStats: (stats: any) => {
    set({
      collaboratorStats: stats,
    });
  },
})); 

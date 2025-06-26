import { create } from 'zustand';
import { apiService } from '../services/api';
import { News, PaginatedData, PaginationParams, ApiResponse } from '../types';
import { handleApiError } from '../utils/errorHandler';

interface NewsState {
  // News data
  newsList: News[];
  selectedNews: News | null;
  
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
  
  // Actions
  loadNews: (refresh?: boolean) => Promise<void>;
  loadMoreNews: () => Promise<void>;
  refreshNews: () => Promise<void>;
  loadNewsDetail: (newsId: string) => Promise<void>;
  setSelectedNews: (news: News | null) => void;
  clearError: () => void;
  reset: () => void;
}

const DEFAULT_PAGE_SIZE = 20;

export const useNewsStore = create<NewsState>((set, get) => ({
  // Initial state
  newsList: [],
  selectedNews: null,
  currentPage: 1,
  totalPages: 0,
  totalItems: 0,
  hasNextPage: false,
  hasPreviousPage: false,
  isLoading: false,
  isLoadingMore: false,
  isRefreshing: false,
  error: null,

  // Load news list with pagination
  loadNews: async (refresh = false) => {
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
      const pagination: PaginationParams = {
        page: refresh ? 1 : currentState.currentPage,
        pageSize: DEFAULT_PAGE_SIZE,
      };

      const response: ApiResponse<PaginatedData<News>> = await apiService.getActiveNews(pagination);
      
      if (response.flag) {
        const newsData = response.data;
        
        // Ensure unique items by filtering out duplicates based on newsId
        let updatedNewsList: News[];
        if (refresh) {
          updatedNewsList = newsData.items;
        } else {
          // Merge with existing list, removing duplicates
          const existingIds = new Set(currentState.newsList.map(item => item.newsId));
          const newItems = newsData.items.filter(item => !existingIds.has(item.newsId));
          updatedNewsList = [...currentState.newsList, ...newItems];
        }
        
        set({
          newsList: updatedNewsList,
          currentPage: newsData.currentPage,
          totalPages: newsData.totalPages,
          totalItems: newsData.totalItems,
          hasNextPage: newsData.hasNextPage,
          hasPreviousPage: newsData.hasPreviousPage,
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

  // Load more news (for pagination)
  loadMoreNews: async () => {
    const currentState = get();
    
    if (!currentState.hasNextPage || currentState.isLoadingMore || currentState.isLoading) {
      return;
    }

    set({ isLoadingMore: true, error: null });

    try {
      const pagination: PaginationParams = {
        page: currentState.currentPage + 1,
        pageSize: DEFAULT_PAGE_SIZE,
      };

      const response: ApiResponse<PaginatedData<News>> = await apiService.getActiveNews(pagination);
      
      if (response.flag) {
        const newsData = response.data;
        
        // Ensure unique items by filtering out duplicates based on newsId
        const existingIds = new Set(currentState.newsList.map(item => item.newsId));
        const newItems = newsData.items.filter(item => !existingIds.has(item.newsId));
        
        set({
          newsList: [...currentState.newsList, ...newItems],
          currentPage: newsData.currentPage,
          totalPages: newsData.totalPages,
          totalItems: newsData.totalItems,
          hasNextPage: newsData.hasNextPage,
          hasPreviousPage: newsData.hasPreviousPage,
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

  // Refresh news list
  refreshNews: async () => {
    await get().loadNews(true);
  },

  // Load news detail
  loadNewsDetail: async (newsId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response: ApiResponse<News> = await apiService.getNewsById(newsId);
      
      if (response.flag) {
        set({
          selectedNews: response.data,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      set({
        isLoading: false,
        error: errorMessage,
      });
    }
  },

  // Set selected news
  setSelectedNews: (news: News | null) => {
    set({ selectedNews: news });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Reset store
  reset: () => {
    set({
      newsList: [],
      selectedNews: null,
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      hasNextPage: false,
      hasPreviousPage: false,
      isLoading: false,
      isLoadingMore: false,
      isRefreshing: false,
      error: null,
    });
  },
})); 
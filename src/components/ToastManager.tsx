import React, { useState, useEffect, createContext, useContext } from 'react';
import CustomToast from './CustomToast';

interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error', duration?: number) => void;
  showSuccessToast: (message: string, duration?: number) => void;
  showErrorToast: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [currentToast, setCurrentToast] = useState<ToastData | null>(null);

  const showToast = (message: string, type: 'success' | 'error', duration?: number) => {
    const id = Date.now().toString();
    setCurrentToast({
      id,
      message,
      type,
      duration,
    });
  };

  const showSuccessToast = (message: string, duration?: number) => {
    showToast(message, 'success', duration);
  };

  const showErrorToast = (message: string, duration?: number) => {
    showToast(message, 'error', duration);
  };

  const hideToast = () => {
    setCurrentToast(null);
  };

  const contextValue: ToastContextType = {
    showToast,
    showSuccessToast,
    showErrorToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {currentToast && (
        <CustomToast
          visible={!!currentToast}
          message={currentToast.message}
          type={currentToast.type}
          duration={currentToast.duration}
          onHide={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
}; 
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';

type LoadingContextType = {
  isLoading: boolean;
  // showLoading giờ đây có thể nhận một tác vụ và thời gian hiển thị tối thiểu
  showLoading: (task?: () => Promise<void> | void, minDisplayTime?: number) => Promise<void>;
  hideLoading: () => void;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);

  const showLoading = useCallback(async (task?: () => Promise<void> | void, minDisplayTime: number = 0) => {
    const startTime = Date.now();
    setIsLoading(true);

    try {
      // Thực thi tác vụ được truyền vào (nếu có)
      if (task) {
        await Promise.resolve(task());
      }
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = minDisplayTime - elapsedTime;

      if (remainingTime > 0) {
        // Đợi cho đến khi đủ thời gian hiển thị tối thiểu
        setTimeout(() => setIsLoading(false), remainingTime);
      } else {
        // Nếu tác vụ mất nhiều thời gian hơn minDisplayTime, ẩn ngay lập tức
        setIsLoading(false);
      }
    }
  }, []);

  const hideLoading = useCallback(() => setIsLoading(false), []);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
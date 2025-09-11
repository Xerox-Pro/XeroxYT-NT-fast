
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';

interface SearchHistoryContextType {
  searchHistory: string[];
  addSearchTerm: (term: string) => void;
}

const SearchHistoryContext = createContext<SearchHistoryContextType | undefined>(undefined);

const SEARCH_HISTORY_KEY = 'searchHistory';
const MAX_HISTORY_LENGTH = 50;

export const SearchHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const item = window.localStorage.getItem(SEARCH_HISTORY_KEY);
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.error("Failed to parse search history from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
    } catch (error) {
      console.error("Failed to save search history to localStorage", error);
    }
  }, [searchHistory]);

  const addSearchTerm = useCallback((term: string) => {
    setSearchHistory(prev => {
      const newHistory = [term, ...prev.filter(t => t.toLowerCase() !== term.toLowerCase())];
      return newHistory.slice(0, MAX_HISTORY_LENGTH);
    });
  }, []);

  return (
    <SearchHistoryContext.Provider value={{ searchHistory, addSearchTerm }}>
      {children}
    </SearchHistoryContext.Provider>
  );
};

export const useSearchHistory = (): SearchHistoryContextType => {
  const context = useContext(SearchHistoryContext);
  if (context === undefined) {
    throw new Error('useSearchHistory must be used within a SearchHistoryProvider');
  }
  return context;
};

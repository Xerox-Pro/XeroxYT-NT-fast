
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

const API_KEY_STORAGE_KEY = 'youtubeApiKey';

export const ApiKeyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    try {
      const storedKey = window.localStorage.getItem(API_KEY_STORAGE_KEY);
      if (storedKey) {
        setApiKeyState(storedKey);
      }
    } catch (error) {
      console.error("Failed to load API key from localStorage", error);
    }
  }, []);

  const setApiKey = (key: string) => {
    try {
        window.localStorage.setItem(API_KEY_STORAGE_KEY, key);
        setApiKeyState(key);
    } catch (error) {
        console.error("Failed to save API key to localStorage", error);
    }
  }

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);


  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, isModalOpen, openModal, closeModal }}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = (): ApiKeyContextType => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};

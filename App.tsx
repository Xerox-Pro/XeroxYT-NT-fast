
import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import VideoPlayerPage from './pages/VideoPlayerPage';
import SearchResultsPage from './pages/SearchResultsPage';
import ChannelPage from './pages/ChannelPage';
import YouPage from './pages/YouPage';
import PlaylistPage from './pages/PlaylistPage';
import { useTheme } from './hooks/useTheme';
import { useApiKey } from './contexts/ApiKeyContext';
import ApiKeyModal from './components/ApiKeyModal';

const App: React.FC = () => {
  const [theme, toggleTheme] = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const location = useLocation();
  const { apiKey, isModalOpen, openModal } = useApiKey();

  useEffect(() => {
    if (!apiKey) {
      openModal();
    }
  }, [apiKey, openModal]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const isVideoPage = location.pathname === '/watch';
  const mainContentMargin = isSidebarOpen ? 'ml-60' : 'ml-[72px]';

  return (
    <div className="min-h-screen bg-yt-white dark:bg-yt-black">
      {isModalOpen && <ApiKeyModal />}
      <Header 
        toggleSidebar={toggleSidebar} 
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`flex-1 p-6 mt-14 ${!isVideoPage ? mainContentMargin : ''} transition-all duration-300`}>
          {apiKey ? (
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/watch" element={<VideoPlayerPage />} />
              <Route path="/results" element={<SearchResultsPage />} />
              <Route path="/channel/:channelId" element={<ChannelPage />} />
              <Route path="/you" element={<YouPage />} />
              <Route path="/playlist/:playlistId" element={<PlaylistPage />} />
            </Routes>
          ) : (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
                <h2 className="text-2xl font-bold mb-4">ようこそ XeroxYT-NTへ</h2>
                <p className="text-yt-light-gray mb-6">アプリを使用するにはYouTube APIキーが必要です。</p>
                <button 
                    onClick={openModal}
                    className="bg-yt-blue text-white font-semibold px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                    APIキーを設定
                </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;

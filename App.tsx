
import React, { useState, useCallback } from 'react';
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

const App: React.FC = () => {
  const [theme, toggleTheme] = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const location = useLocation();

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const isVideoPage = location.pathname === '/watch';
  const mainContentMargin = isSidebarOpen ? 'ml-60' : 'ml-[72px]';

  return (
    <div className="min-h-screen bg-yt-white dark:bg-yt-black">
      <Header 
        toggleSidebar={toggleSidebar} 
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`flex-1 p-6 mt-14 ${!isVideoPage ? mainContentMargin : ''} transition-all duration-300`}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/watch" element={<VideoPlayerPage />} />
            <Route path="/results" element={<SearchResultsPage />} />
            <Route path="/channel/:channelId" element={<ChannelPage />} />
            <Route path="/you" element={<YouPage />} />
            <Route path="/playlist/:playlistId" element={<PlaylistPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;

import React, { useState, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import SearchResultsPage from './pages/SearchResultsPage';
import ChannelPage from './pages/ChannelPage';
import YouPage from './pages/YouPage';
import PlaylistPage from './pages/PlaylistPage';
import ShortsPage from './pages/ShortsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import HistoryPage from './pages/HistoryPage';
import VideoPlayerPage from './pages/VideoPlayerPage';
import { useTheme } from './hooks/useTheme';

const App: React.FC = () => {
  const [theme, toggleTheme] = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const location = useLocation();

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const isPlayerPage = location.pathname.startsWith('/watch');
  const isShortsPage = location.pathname === '/shorts';
  
  const getMargin = () => {
    if (isPlayerPage || isShortsPage) return '';
    if (isSidebarOpen) return 'ml-56';
    return 'ml-[72px]';
  };

  const mainContentMargin = getMargin();
  const mainContentPadding = isShortsPage ? '' : isPlayerPage ? 'p-6 lg:px-24' : 'p-6';
  
  // サイドバーの表示ロジックを修正
  // 通常ページでは常に表示（開閉はSidebarコンポーネント内部で制御）
  // プレーヤーページでは、isSidebarOpenがtrueの時だけオーバーレイとして表示
  // ショートページでは非表示
  const shouldShowSidebar = () => {
    if (isShortsPage) return false;
    if (isPlayerPage) return isSidebarOpen;
    return true;
  };

  return (
    <div className="min-h-screen bg-yt-white dark:bg-yt-black">
      <Header 
        toggleSidebar={toggleSidebar} 
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <div className="flex">
        {shouldShowSidebar() && <Sidebar isOpen={isSidebarOpen} />}
        <main className={`flex-1 mt-14 ${mainContentMargin} ${mainContentPadding} transition-all duration-300`}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/watch/:videoId" element={<VideoPlayerPage />} />
            <Route path="/results" element={<SearchResultsPage />} />
            <Route path="/channel/:channelId" element={<ChannelPage />} />
            <Route path="/you" element={<YouPage />} />
            <Route path="/playlist/:playlistId" element={<PlaylistPage />} />
            <Route path="/shorts" element={<ShortsPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            {/* Redirect any other path to home */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;

import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import VideoGrid from './components/VideoGrid';
import VideoPlayerPage from './components/VideoPlayerPage';
import { getRecommendedVideos, searchVideos } from './utils/api';
import type { Video } from './types';

type View = 'home' | 'video';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [view, setView] = useState<View>('home');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);
  
  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const recommendedVideos = await getRecommendedVideos();
      setVideos(recommendedVideos);
    } catch (err) {
      setError('Failed to load videos. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleSelectVideo = useCallback((videoId: string) => {
    setSelectedVideoId(videoId);
    setView('video');
    window.scrollTo(0, 0);
  }, []);

  const handleGoHome = useCallback(() => {
    setView('home');
    setSelectedVideoId(null);
    if(videos.length === 0) fetchVideos();
  }, [videos, fetchVideos]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query) {
      fetchVideos();
      return;
    }
    setIsLoading(true);
    setError(null);
    setView('home');
    setSelectedVideoId(null);
    try {
      const searchResults = await searchVideos(query);
      setVideos(searchResults);
    } catch (err) {
      setError('Failed to perform search. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchVideos]);

  const mainContentMargin = isSidebarOpen ? 'ml-60' : 'ml-[72px]';

  return (
    <div className="min-h-screen bg-yt-black">
      <Header toggleSidebar={toggleSidebar} onSearch={handleSearch} goHome={handleGoHome} />
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`flex-1 p-6 mt-14 ${view === 'home' ? mainContentMargin : ''} transition-all duration-300`}>
          {error && <div className="text-center text-red-500">{error}</div>}
          {view === 'home' ? (
            <VideoGrid videos={videos} onSelectVideo={handleSelectVideo} isLoading={isLoading} />
          ) : (
            selectedVideoId && <VideoPlayerPage videoId={selectedVideoId} onSelectVideo={handleSelectVideo} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;

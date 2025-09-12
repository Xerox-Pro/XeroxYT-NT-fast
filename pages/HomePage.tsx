
import React, { useState, useEffect, useCallback } from 'react';
import VideoGrid from '../components/VideoGrid';
import { getRecommendedVideos } from '../utils/api';
import type { Video } from '../types';

const HomePage: React.FC = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadTrendingVideos = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const { videos: trendingVideos } = await getRecommendedVideos();
            setVideos(trendingVideos);
        } catch (err: any) {
            setError(err.message || '動画の読み込みに失敗しました。');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTrendingVideos();
    }, [loadTrendingVideos]);
    

    if (error) {
        return <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">{error}</div>;
    }

    return (
        <div>
            <VideoGrid videos={videos} isLoading={isLoading} />
        </div>
    );
};

export default HomePage;

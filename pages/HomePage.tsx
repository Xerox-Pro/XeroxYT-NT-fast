
import React, { useState, useEffect, useCallback } from 'react';
import VideoGrid from '../components/VideoGrid';
import { getRecommendedVideos, searchVideos, getChannelVideos } from '../utils/api';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useSearchHistory } from '../contexts/SearchHistoryContext';
import type { Video } from '../types';

const HomePage: React.FC = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { subscribedChannels } = useSubscription();
    const { searchHistory } = useSearchHistory();

    const loadHomePageFeed = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const promises = [];

            // 1. Fetch from /api/fvideo
            promises.push(getRecommendedVideos().then(res => res.videos));

            // 2. Fetch based on search history (top 5 recent)
            const searchTerms = searchHistory.slice(0, 5);
            searchTerms.forEach(term => {
                promises.push(searchVideos(term).then(res => res.videos));
            });
            
            // 3. Fetch from subscribed channels (latest 5 videos from up to 10 channels)
            const channelsToFetch = subscribedChannels.slice(0, 10);
            channelsToFetch.forEach(channel => {
                promises.push(getChannelVideos(channel.id).then(res => res.videos.slice(0, 5)));
            });

            const results = await Promise.allSettled(promises);

            let allVideos: Video[] = [];
            results.forEach(result => {
                if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                    allVideos.push(...result.value);
                }
            });

            // De-duplicate videos
            const uniqueVideos = Array.from(new Map(allVideos.map(v => [v.id, v])).values());
            
            // Shuffle for a mixed feed
            const shuffleArray = (array: Video[]) => {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
                return array;
            };

            setVideos(shuffleArray(uniqueVideos));

        } catch (err: any) {
            setError(err.message || '動画の読み込みに失敗しました。');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [subscribedChannels, searchHistory]);

    useEffect(() => {
        loadHomePageFeed();
    }, [loadHomePageFeed]);
    

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

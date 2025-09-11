
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import VideoGrid from '../components/VideoGrid';
import { getRecommendedVideos, searchVideos } from '../utils/api';
import type { Video } from '../types';
import VideoCardSkeleton from '../components/icons/VideoCardSkeleton';
import { useApiKey } from '../contexts/ApiKeyContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useSearchHistory } from '../contexts/SearchHistoryContext';

const HomePage: React.FC = () => {
    const { apiKey } = useApiKey();
    const { subscribedChannels } = useSubscription();
    const { searchHistory } = useSearchHistory();
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const recommendationTerms = useMemo(() => {
        const terms = new Set<string>();
        subscribedChannels.forEach(c => terms.add(`"${c.name}"`));
        searchHistory.slice(0, 5).forEach(h => terms.add(h)); // Use latest 5 search terms
        return Array.from(terms);
    }, [subscribedChannels, searchHistory]);

    const shuffleArray = (array: any[]) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    const loadVideos = useCallback(async () => {
        if (!apiKey) {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            // Create promises for all data sources
            const promises = [
                getRecommendedVideos(apiKey).then(res => res.videos), // Popular videos
                ...recommendationTerms.map(term => searchVideos(apiKey, term, '').then(res => res.videos))
            ];
            
            const results = await Promise.allSettled(promises);
            
            let allVideos: Video[] = [];
            results.forEach(result => {
                if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                    allVideos.push(...result.value);
                }
            });

            // De-duplicate videos based on ID, keeping the first occurrence
            const uniqueVideos = Array.from(new Map(allVideos.map(v => [v.id, v])).values());
            
            setVideos(shuffleArray(uniqueVideos));

        } catch (err: any) {
            setError(err.message || '動画の読み込みに失敗しました。');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, recommendationTerms]);
    
    useEffect(() => {
        loadVideos();
    }, [loadVideos]);

    if (isLoading) {
        return (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
                {Array.from({ length: 20 }).map((_, index) => (
                    <VideoCardSkeleton key={index} />
                ))}
            </div>
        );
    }
    
    if (error) {
        return <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">{error}</div>;
    }

    return (
        <>
            <VideoGrid videos={videos} isLoading={isLoading} />
            {!isLoading && videos.length > 0 && (
                <div className="text-center text-yt-light-gray py-4">フィードの終端です。</div>
            )}
        </>
    );
};

export default HomePage;

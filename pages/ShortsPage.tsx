
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ShortsPlayer from '../components/ShortsPlayer';
import { searchVideos, getRecommendedVideos } from '../utils/api';
import type { Video } from '../types';
import { useApiKey } from '../contexts/ApiKeyContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useSearchHistory } from '../contexts/SearchHistoryContext';

const ShortsPage: React.FC = () => {
    const { apiKey } = useApiKey();
    const { subscribedChannels } = useSubscription();
    const { searchHistory } = useSearchHistory();
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const shortsQueryTerms = useMemo(() => {
        const terms = new Set<string>();
        subscribedChannels.forEach(c => terms.add(`"${c.name} #shorts"`));
        searchHistory.slice(0, 5).forEach(h => terms.add(`${h} #shorts`));
        return Array.from(terms);
    }, [subscribedChannels, searchHistory]);

    const shuffleArray = (array: any[]) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    const loadShorts = useCallback(async () => {
        if (!apiKey) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const promises = [
                searchVideos(apiKey, 'trending #shorts').then(res => res.videos),
                ...shortsQueryTerms.map(term => searchVideos(apiKey, term, '').then(res => res.videos))
            ];
            
            const results = await Promise.allSettled(promises);
            
            let allVideos: Video[] = [];
            results.forEach(result => {
                if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                    allVideos.push(...result.value);
                }
            });

            const uniqueVideos = Array.from(new Map(allVideos.map(v => [v.id, v])).values());
            
            setVideos(shuffleArray(uniqueVideos));

        } catch (err: any) {
            setError(err.message || 'ショート動画の読み込みに失敗しました。');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, shortsQueryTerms]);

    useEffect(() => {
        loadShorts();
    }, [loadShorts]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yt-blue"></div>
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg m-4">{error}</div>;
    }
    
    return (
        <div className="h-full w-full overflow-y-auto snap-y snap-mandatory scroll-smooth flex flex-col items-center">
            {videos.length > 0 ? (
                videos.map(video => (
                    <div key={video.id} className="h-full w-full flex-shrink-0 snap-center flex justify-center items-center py-4">
                        <ShortsPlayer video={video} />
                    </div>
                ))
            ) : (
                <div className="text-center h-full flex items-center justify-center">
                    <p>ショート動画が見つかりませんでした。</p>
                </div>
            )}
        </div>
    );
};
export default ShortsPage;

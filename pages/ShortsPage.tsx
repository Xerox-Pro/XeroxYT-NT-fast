
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ShortsPlayer from '../components/ShortsPlayer';
import { searchVideos } from '../utils/api';
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

    const shortsQuery = useMemo(() => {
        const terms = new Set<string>();
        subscribedChannels.forEach(c => terms.add(`"${c.name}"`));
        searchHistory.slice(0, 10).forEach(h => terms.add(h));
        if (terms.size === 0) {
            return "popular trending #shorts";
        }
        return Array.from(terms).join(' | ') + ' | #shorts';
    }, [subscribedChannels, searchHistory]);

    const loadShorts = useCallback(async () => {
        if (!apiKey) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const { videos: newVideos } = await searchVideos(apiKey, shortsQuery);
            setVideos(newVideos);
        } catch (err: any) {
            setError(err.message || 'ショート動画の読み込みに失敗しました。');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, shortsQuery]);

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
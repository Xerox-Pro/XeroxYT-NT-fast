
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import VideoGrid from '../components/VideoGrid';
import { getRecommendedVideos, searchVideos } from '../utils/api';
import type { Video } from '../types';
import VideoCardSkeleton from '../components/icons/VideoCardSkeleton';
import { useApiKey } from '../contexts/ApiKeyContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useSearchHistory } from '../contexts/SearchHistoryContext';

const useInfiniteScroll = (callback: () => void) => {
    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: HTMLDivElement | null) => {
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                callback();
            }
        });
        if (node) observer.current.observe(node);
    }, [callback]);

    return lastElementRef;
};

const HomePage: React.FC = () => {
    const { apiKey } = useApiKey();
    const { subscribedChannels } = useSubscription();
    const { searchHistory } = useSearchHistory();
    const [videos, setVideos] = useState<Video[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const recommendationQuery = useMemo(() => {
        const terms = new Set<string>();
        subscribedChannels.forEach(c => terms.add(`"${c.name}"`));
        searchHistory.slice(0, 10).forEach(h => terms.add(h));
        
        if (terms.size === 0) return null;
        return Array.from(terms).join(' | ');
    }, [subscribedChannels, searchHistory]);

    const loadVideos = useCallback(async (token?: string) => {
        if (!apiKey) return;
        
        setError(null);
        token ? setIsLoadingMore(true) : setIsLoading(true);
        
        try {
            let result;
            if (recommendationQuery) {
                result = await searchVideos(apiKey, recommendationQuery, token);
            } else {
                result = await getRecommendedVideos(apiKey, token);
            }
            const { videos: newVideos, nextPageToken: nextToken } = result;

            setVideos(prev => token ? [...prev, ...newVideos] : newVideos);
            setNextPageToken(nextToken);
        } catch (err: any) {
            setError(err.message || '動画の読み込みに失敗しました。');
            console.error(err);
        } finally {
            token ? setIsLoadingMore(false) : setIsLoading(false);
        }
    }, [apiKey, recommendationQuery]);
    
    useEffect(() => {
        if (apiKey) {
            setVideos([]);
            setNextPageToken(undefined);
            loadVideos();
        } else {
            setIsLoading(false);
        }
    }, [apiKey, recommendationQuery]); // eslint-disable-line react-hooks/exhaustive-deps


    const handleLoadMore = useCallback(() => {
        if (!isLoadingMore && nextPageToken) {
            loadVideos(nextPageToken);
        }
    }, [isLoadingMore, nextPageToken, loadVideos]);

    const lastElementRef = useInfiniteScroll(handleLoadMore);

    if (isLoading && videos.length === 0) {
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
            {recommendationQuery && videos.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-xl font-bold">あなたへのおすすめ</h2>
                    <p className="text-sm text-yt-light-gray">登録チャンネルや検索履歴に基づいています。</p>
                </div>
            )}
            <VideoGrid videos={videos} isLoading={isLoading && videos.length === 0} />
            <div ref={lastElementRef} className="h-10">
                {isLoadingMore && (
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8 mt-8">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <VideoCardSkeleton key={index} />
                        ))}
                    </div>
                )}
            </div>
            {!isLoadingMore && !nextPageToken && videos.length > 0 && (
                <div className="text-center text-yt-light-gray py-4">これ以上動画はありません。</div>
            )}
        </>
    );
};

export default HomePage;
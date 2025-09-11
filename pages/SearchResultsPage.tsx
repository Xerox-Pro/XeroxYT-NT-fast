
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchVideos } from '../utils/api';
import type { Video } from '../types';
import SearchVideoResultCard from '../components/SearchVideoResultCard';
import VideoCardSkeleton from '../components/icons/VideoCardSkeleton'; // Using a generic skeleton for now
import { useApiKey } from '../contexts/ApiKeyContext';

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

const SearchResultsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('search_query');
    const { apiKey } = useApiKey();
    
    const [videos, setVideos] = useState<Video[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const performSearch = useCallback(async (searchQuery: string, token?: string) => {
        if (!apiKey || !searchQuery) return;
        
        setError(null);
        token ? setIsLoadingMore(true) : setIsLoading(true);
        
        try {
            const { videos: newVideos, nextPageToken: nextToken } = await searchVideos(apiKey, searchQuery, token);
            setVideos(prev => token ? [...prev, ...newVideos] : newVideos);
            setNextPageToken(nextToken);
        } catch (err: any) {
            setError(err.message || '検索の実行に失敗しました。');
            console.error(err);
        } finally {
            token ? setIsLoadingMore(false) : setIsLoading(false);
        }
    }, [apiKey]);

    useEffect(() => {
        setVideos([]);
        setNextPageToken(undefined);
        if (query && apiKey) {
            performSearch(query);
        } else {
            setIsLoading(false);
        }
    }, [query, performSearch, apiKey]);

    const handleLoadMore = useCallback(() => {
        if (!isLoadingMore && nextPageToken && query) {
            performSearch(query, nextPageToken);
        }
    }, [isLoadingMore, nextPageToken, query, performSearch]);

    const lastElementRef = useInfiniteScroll(handleLoadMore);

    if (isLoading) {
        return (
             <div className="flex flex-col space-y-4">
                {Array.from({ length: 10 }).map((_, index) => (
                   <div key={index} className="flex space-x-4 animate-pulse">
                        <div className="w-64 h-36 bg-yt-light dark:bg-yt-dark-gray rounded-lg"></div>
                        <div className="flex-1 space-y-3 py-1">
                            <div className="h-4 bg-yt-light dark:bg-yt-dark-gray rounded w-3/4"></div>
                            <div className="h-4 bg-yt-light dark:bg-yt-dark-gray rounded w-1/2"></div>
                            <div className="h-4 bg-yt-light dark:bg-yt-dark-gray rounded w-1/3"></div>
                        </div>
                   </div>
                ))}
            </div>
        );
    }
    
    if (error) {
        return <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">{error}</div>;
    }

    if (videos.length === 0) {
        return <div className="text-center">「{query}」の検索結果はありません。</div>
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col space-y-4">
                {videos.map((video, index) => (
                    <SearchVideoResultCard key={`${video.id}-${index}`} video={video} />
                ))}
            </div>
            <div ref={lastElementRef} className="h-10">
                {isLoadingMore && <p className="text-center">読み込み中...</p>}
            </div>
             {!isLoadingMore && !nextPageToken && videos.length > 0 && (
                <div className="text-center text-yt-light-gray py-4">これ以上結果はありません。</div>
            )}
        </div>
    );
};

export default SearchResultsPage;

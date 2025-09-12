import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchVideos } from '../utils/api';
import type { Video } from '../types';
import SearchVideoResultCard from '../components/SearchVideoResultCard';

const SearchResultsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('search_query');
    
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery) return;
        
        setError(null);
        setIsLoading(true);
        
        try {
            const { videos: newVideos } = await searchVideos(searchQuery);
            setVideos(newVideos);
        } catch (err: any) {
            setError(err.toString());
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setVideos([]);
        if (query) {
            performSearch(query);
        } else {
            setIsLoading(false);
        }
    }, [query, performSearch]);

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

    if (videos.length === 0 && query) {
        return <div className="text-center">「{query}」の検索結果はありません。</div>
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col space-y-4">
                {videos.map((video, index) => (
                    <SearchVideoResultCard key={`${video.id}-${index}`} video={video} />
                ))}
            </div>
        </div>
    );
};

export default SearchResultsPage;
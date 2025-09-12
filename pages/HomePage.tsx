
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import VideoGrid from '../components/VideoGrid';
import ShortsShelf from '../components/ShortsShelf';
import { getRecommendedVideos, searchVideos, getChannelVideos } from '../utils/api';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useSearchHistory } from '../contexts/SearchHistoryContext';
import type { Video } from '../types';

const HomePage: React.FC = () => {
    const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
    const [shorts, setShorts] = useState<Video[]>([]);
    const [isLoadingRecommended, setIsLoadingRecommended] = useState(true);
    const [isLoadingShorts, setIsLoadingShorts] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { subscribedChannels } = useSubscription();
    const { searchHistory } = useSearchHistory();

    const shuffleArray = <T,>(array: T[]): T[] => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    const loadRecommended = useCallback(async () => {
        setIsLoadingRecommended(true);
        try {
            const fvideoPromise = getRecommendedVideos().then(res => res.videos);
            const searchPromises = searchHistory.slice(0, 5).map(term => searchVideos(term).then(res => res.videos));
            const channelPromises = subscribedChannels.slice(0, 10).map(channel => getChannelVideos(channel.id).then(res => res.videos.slice(0, 5)));

            const results = await Promise.allSettled([fvideoPromise, ...searchPromises, ...channelPromises]);
            const allVideos = results.flatMap(result => (result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []));
            
            const uniqueVideos = Array.from(new Map(allVideos.map(v => [v.id, v])).values());
            setRecommendedVideos(shuffleArray(uniqueVideos));
        } catch (err: any) {
            setError(err.message || '動画の読み込みに失敗しました。');
            console.error(err);
        } finally {
            setIsLoadingRecommended(false);
        }
    }, [subscribedChannels, searchHistory]);

    const loadShorts = useCallback(async () => {
        setIsLoadingShorts(true);
        try {
            const searchTerms = ['#shorts', ...searchHistory.slice(0, 3).map(term => `${term} #shorts`)];
            const promises = searchTerms.map(term => searchVideos(term).then(res => res.videos));
            const results = await Promise.allSettled(promises);
            const allShorts = results.flatMap(result => (result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []));

            const uniqueShorts = Array.from(new Map(allShorts.map(v => [v.id, v])).values());
            setShorts(shuffleArray(uniqueShorts.filter(v => v.isoDuration && (parseInt(v.isoDuration.slice(2, -1)) <= 60))));
        } catch (err) {
            console.error('Failed to load shorts:', err);
        } finally {
            setIsLoadingShorts(false);
        }
    }, [searchHistory]);


    useEffect(() => {
        setError(null);
        loadRecommended();
        loadShorts();
    }, [loadRecommended, loadShorts]);
    

    if (error) {
        return <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">{error}</div>;
    }

    return (
        <div className="space-y-8">
            <ShortsShelf shorts={shorts} isLoading={isLoadingShorts} />
            <hr className="border-yt-spec-light-20 dark:border-yt-spec-20" />
            <VideoGrid videos={recommendedVideos} isLoading={isLoadingRecommended} />
        </div>
    );
};

export default HomePage;
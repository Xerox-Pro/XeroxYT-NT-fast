
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import VideoGrid from '../components/VideoGrid';
import ShortsShelf from '../components/ShortsShelf';
import { getRecommendedVideos, searchVideos, getChannelVideos } from '../utils/api';
import type { Video } from '../types';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useSearchHistory } from '../contexts/SearchHistoryContext';

const parseISODuration = (isoDuration: string): number => {
    if (!isoDuration) return 0;
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = isoDuration.match(regex);
    if (!matches) return 0;
    const hours = parseInt(matches[1] || '0', 10);
    const minutes = parseInt(matches[2] || '0', 10);
    const seconds = parseInt(matches[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
};

const shuffleArray = <T,>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const HomePage: React.FC = () => {
    const { subscribedChannels } = useSubscription();
    const { searchHistory } = useSearchHistory();
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadMixedFeed = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const promises = [
                getRecommendedVideos().then(res => res.videos),
                ...subscribedChannels.slice(0, 5).map(c => getChannelVideos(c.id).then(res => res.videos.slice(0, 3))),
                ...searchHistory.slice(0, 5).map(term => searchVideos(term).then(res => res.videos.slice(0, 3)))
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
            setError(err.message || '動画の読み込みに失敗しました。');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [subscribedChannels, searchHistory]);

    useEffect(() => {
        loadMixedFeed();
    }, [loadMixedFeed]);
    
    const { shorts, regularVideos } = useMemo(() => {
        const shortsArr: Video[] = [];
        const regularArr: Video[] = [];
        videos.forEach(video => {
            const durationInSeconds = parseISODuration(video.isoDuration);
            if (video.isoDuration && durationInSeconds > 0 && durationInSeconds <= 60) {
                shortsArr.push(video);
            } else {
                regularArr.push(video);
            }
        });
        return { shorts: shortsArr, regularVideos: regularArr };
    }, [videos]);


    if (error) {
        return <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">{error}</div>;
    }

    return (
        <div>
            {(isLoading && shorts.length === 0) || shorts.length > 0 ? (
                <>
                    <ShortsShelf shorts={shorts} isLoading={isLoading && videos.length === 0} />
                    <hr className="my-6 border-yt-spec-light-20 dark:border-yt-spec-20" />
                </>
            ) : null}
            
            <VideoGrid videos={regularVideos} isLoading={isLoading && videos.length === 0} />
        </div>
    );
};

export default HomePage;
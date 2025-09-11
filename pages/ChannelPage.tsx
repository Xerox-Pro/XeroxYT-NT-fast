
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getChannelDetails, getChannelVideos } from '../utils/api';
import type { ChannelDetails, Video } from '../types';
import VideoGrid from '../components/VideoGrid';
import VideoCardSkeleton from '../components/skeletons/VideoCardSkeleton';
import { useSubscription } from '../contexts/SubscriptionContext';
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

const ChannelPage: React.FC = () => {
    const { channelId } = useParams<{ channelId: string }>();
    const { apiKey } = useApiKey();
    const [channelDetails, setChannelDetails] = useState<ChannelDetails | null>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    
    const { isSubscribed, subscribe, unsubscribe } = useSubscription();

    const loadData = useCallback(async (token?: string) => {
        if (!channelId || !apiKey || (token === undefined && videos.length > 0)) return;

        setError(null);
        if (token) {
            setIsLoadingMore(true);
        } else {
            setIsLoading(true);
            setVideos([]);
            setChannelDetails(null);
        }

        try {
            if (!token) {
                const details = await getChannelDetails(apiKey, channelId);
                setChannelDetails(details);
            }
            const { videos: newVideos, nextPageToken: nextToken } = await getChannelVideos(apiKey, channelId, token);
            setVideos(prev => token ? [...prev, ...newVideos] : newVideos);
            setNextPageToken(nextToken);
        } catch (err: any) {
            setError(err.message || 'チャンネルデータの読み込みに失敗しました。');
            console.error(err);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [channelId, apiKey, videos.length]);

    useEffect(() => {
        if (apiKey) {
            loadData();
        }
    }, [channelId, apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleLoadMore = useCallback(() => {
        if (!isLoadingMore && nextPageToken) {
            loadData(nextPageToken);
        }
    }, [isLoadingMore, nextPageToken, loadData]);

    const lastElementRef = useInfiniteScroll(handleLoadMore);

    if (isLoading && !channelDetails) {
        // A more detailed channel skeleton could be added here
        return <div className="text-center p-8">読み込み中...</div>; 
    }

    if (error) {
        return <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">{error}</div>;
    }

    if (!channelDetails) return null;

    const subscribed = isSubscribed(channelDetails.id);
    const handleSubscription = () => {
        if (subscribed) {
          unsubscribe(channelDetails.id);
        } else {
          subscribe(channelDetails);
        }
    };


    return (
        <div>
            {channelDetails.bannerUrl && (
                <div className="w-full h-32 md:h-48 lg:h-56 mb-4">
                    <img src={channelDetails.bannerUrl} alt={`${channelDetails.name} banner`} className="w-full h-full object-cover" />
                </div>
            )}
            <div className="flex flex-col sm:flex-row items-center px-4 mb-6">
                <img src={channelDetails.avatarUrl} alt={channelDetails.name} className="w-20 h-20 sm:w-32 sm:h-32 rounded-full mr-0 sm:mr-6 mb-4 sm:mb-0" />
                <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl font-bold">{channelDetails.name}</h1>
                    <p className="text-sm text-yt-light-gray mt-1">{channelDetails.subscriberCount}</p>
                </div>
                 <button 
                  onClick={handleSubscription}
                  className={`mt-4 sm:mt-0 font-semibold px-4 h-10 rounded-full text-sm hover:opacity-90 flex items-center transform transition-transform duration-150 active:scale-95 ${subscribed ? 'bg-yt-light dark:bg-yt-dark-gray text-black dark:text-white' : 'bg-black dark:bg-white text-white dark:text-black'}`}
                >
                  {subscribed ? '登録済み' : 'チャンネル登録'}
                </button>
            </div>
            
            <hr className="border-yt-spec-light-20 dark:border-yt-spec-20 my-4" />

            <h2 className="text-lg font-bold mb-4 px-4">アップロード動画</h2>
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
        </div>
    );
};

export default ChannelPage;

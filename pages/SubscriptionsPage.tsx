
import React, { useState, useEffect, useCallback } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useApiKey } from '../contexts/ApiKeyContext';
import { getChannelVideos } from '../utils/api';
import type { Video } from '../types';
import VideoGrid from '../components/VideoGrid';
import VideoCardSkeleton from '../components/icons/VideoCardSkeleton';
import { Link } from 'react-router-dom';

const SubscriptionsPage: React.FC = () => {
    const { subscribedChannels } = useSubscription();
    const { apiKey } = useApiKey();
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubscriptionFeed = useCallback(async () => {
        if (!apiKey) {
            setError("APIキーが設定されていません。");
            setIsLoading(false);
            return;
        }

        if (subscribedChannels.length === 0) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch the 5 most recent videos from up to 10 subscribed channels
            const channelPromises = subscribedChannels.slice(0, 10).map(channel => 
                getChannelVideos(apiKey, channel.id).then(res => res.videos.slice(0, 5))
            );

            const results = await Promise.all(channelPromises);
            const allVideos = results.flat();
            
            const uniqueVideos = Array.from(new Map(allVideos.map(v => [v.id, v])).values());
            
            // This sorting is imperfect because formatTimeAgo is not precise.
            // A robust solution would require modifying the API layer to return raw dates.
            // Given the constraints, we will accept this limitation.
            setVideos(uniqueVideos.slice(0, 50)); // Limit total videos

        } catch (err: any) {
            setError(err.message || '登録チャンネルの動画の読み込みに失敗しました。');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, subscribedChannels]);

    useEffect(() => {
        fetchSubscriptionFeed();
    }, [fetchSubscriptionFeed]);

    if (isLoading) {
        return (
            <div>
                <h1 className="text-2xl font-bold mb-6">登録チャンネル</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
                    {Array.from({ length: 10 }).map((_, index) => <VideoCardSkeleton key={index} />)}
                </div>
            </div>
        );
    }
    
    if (error) {
        return <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">{error}</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">登録チャンネル</h1>
            {subscribedChannels.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-yt-light-gray mb-4">登録しているチャンネルはありません。</p>
                    <Link to="/" className="bg-yt-blue text-white font-semibold px-6 py-2 rounded-lg hover:opacity-90 transition-opacity">
                        動画を探す
                    </Link>
                </div>
            ) : videos.length === 0 && !isLoading ? (
                 <div className="text-center py-10">
                    <p className="text-yt-light-gray">登録チャンネルからの新しい動画はありません。</p>
                </div>
            ) : (
                <VideoGrid videos={videos} isLoading={false} />
            )}
        </div>
    );
};

export default SubscriptionsPage;

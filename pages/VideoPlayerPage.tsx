import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVideoDetails, getPlayerConfig } from '../utils/api';
import type { VideoDetails, Video } from '../types';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useHistory } from '../contexts/HistoryContext';
import VideoPlayerPageSkeleton from '../components/skeletons/VideoPlayerPageSkeleton';
import RelatedVideoCard from '../components/RelatedVideoCard';
import PlaylistModal from '../components/PlaylistModal';
import { LikeIcon, DislikeIcon, ShareIcon, SaveIcon } from '../components/icons/Icons';

const VideoPlayerPage: React.FC = () => {
    const { videoId } = useParams<{ videoId: string }>();
    const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const [playerParams, setPlayerParams] = useState<string | null>(null);

    const { isSubscribed, subscribe, unsubscribe } = useSubscription();
    const { addVideoToHistory } = useHistory();
    
    useEffect(() => {
        const fetchPlayerParams = async () => {
            setPlayerParams(await getPlayerConfig());
        };
        fetchPlayerParams();
    }, []);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!videoId) return;
            setIsLoading(true);
            setError(null);
            setVideoDetails(null);
            window.scrollTo(0, 0);

            try {
                const details = await getVideoDetails(videoId);
                setVideoDetails(details);
                addVideoToHistory(details);
            } catch (err: any) {
                setError(err.message || '動画の読み込みに失敗しました。');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [videoId, addVideoToHistory]);

    if (isLoading || playerParams === null) {
        return <VideoPlayerPageSkeleton />;
    }

    if (error && !videoDetails) {
        return (
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-grow lg:w-2/3">
                    <div className="aspect-video bg-yt-black rounded-xl overflow-hidden">
                        {videoId && playerParams && (
                             <iframe
                                src={`https://www.youtubeeducation.com/embed/${videoId}${playerParams}`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                            ></iframe>
                        )}
                    </div>
    
                    <div className="mt-4 p-4 rounded-lg bg-red-100 dark:bg-red-900/50 text-black dark:text-yt-white">
                        <h2 className="text-lg font-bold mb-2 text-red-500">動画情報の取得エラー</h2>
                        <p>{error}</p>
                    </div>
                </div>
                
                <div className="lg:w-1/3 lg:max-w-sm flex-shrink-0">
                    <div className="bg-yt-light dark:bg-yt-dark-gray p-4 rounded-xl text-center">
                        <p className="font-semibold">関連動画の読み込みに失敗しました。</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!videoDetails) {
        return null;
    }
    
    const subscribed = isSubscribed(videoDetails.channel.id);
    const handleSubscriptionToggle = () => {
        if (subscribed) {
            unsubscribe(videoDetails.channel.id);
        } else {
            subscribe(videoDetails.channel);
        }
    };

    const videoForPlaylistModal: Video = {
      id: videoDetails.id,
      title: videoDetails.title,
      thumbnailUrl: videoDetails.thumbnailUrl,
      channelName: videoDetails.channelName,
      channelId: videoDetails.channelId,
      duration: videoDetails.duration,
      isoDuration: videoDetails.isoDuration,
      views: videoDetails.views,
      uploadedAt: videoDetails.uploadedAt,
      channelAvatarUrl: videoDetails.channelAvatarUrl,
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-grow lg:w-2/3">
                <div className="aspect-video bg-yt-black rounded-xl overflow-hidden">
                     <iframe
                        src={`https://www.youtubeeducation.com/embed/${videoDetails.id}${playerParams}`}
                        title={videoDetails.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                    ></iframe>
                </div>

                <h1 className="text-xl font-bold mt-4">{videoDetails.title}</h1>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4">
                    <div className="flex items-center mb-4 sm:mb-0">
                        <Link to={`/channel/${videoDetails.channel.id}`} className="flex items-center">
                            <img src={videoDetails.channel.avatarUrl} alt={videoDetails.channel.name} className="w-10 h-10 rounded-full" />
                            <div className="ml-3">
                                <p className="font-semibold">{videoDetails.channel.name}</p>
                                <p className="text-sm text-yt-light-gray">{videoDetails.channel.subscriberCount}</p>
                            </div>
                        </Link>
                         <button 
                            onClick={handleSubscriptionToggle}
                            className={`ml-6 font-semibold px-4 h-9 rounded-full text-sm flex items-center transform transition-transform duration-150 active:scale-95 ${subscribed ? 'bg-yt-light dark:bg-yt-dark-gray text-black dark:text-white' : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'}`}
                        >
                            {subscribed ? '登録済み' : 'チャンネル登録'}
                        </button>
                    </div>

                    <div className="flex items-center space-x-2">
                        <div className="flex items-center bg-yt-light dark:bg-yt-dark-gray rounded-full h-9">
                            <button className="flex items-center pl-4 pr-3 py-2 hover:bg-yt-spec-light-10 dark:hover:bg-yt-spec-10 rounded-l-full">
                                <LikeIcon />
                                <span className="ml-2 text-sm font-semibold">{videoDetails.likes}</span>
                            </button>
                            <div className="w-px h-5 bg-yt-spec-light-20 dark:bg-yt-spec-20"></div>
                             <button className="px-3 py-2 hover:bg-yt-spec-light-10 dark:hover:bg-yt-spec-10 rounded-r-full">
                                <DislikeIcon />
                            </button>
                        </div>
                        <button className="flex items-center bg-yt-light dark:bg-yt-dark-gray rounded-full h-9 px-4 hover:bg-yt-spec-light-10 dark:hover:bg-yt-spec-10">
                            <ShareIcon />
                            <span className="ml-2 text-sm font-semibold">共有</span>
                        </button>
                        <button onClick={() => setIsPlaylistModalOpen(true)} className="flex items-center bg-yt-light dark:bg-yt-dark-gray rounded-full h-9 px-4 hover:bg-yt-spec-light-10 dark:hover:bg-yt-spec-10">
                            <SaveIcon />
                            <span className="ml-2 text-sm font-semibold">保存</span>
                        </button>
                    </div>
                </div>

                <div className="mt-4 bg-yt-light dark:bg-yt-dark-gray p-3 rounded-xl cursor-pointer" onClick={() => setIsDescriptionExpanded(prev => !prev)}>
                    <p className="font-semibold text-sm">{videoDetails.views} \u2022 {videoDetails.uploadedAt}</p>
                    <p 
                        className={`text-sm mt-2 whitespace-pre-wrap ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}
                        dangerouslySetInnerHTML={{ __html: videoDetails.description }}
                    />
                    <button className="font-semibold text-sm mt-2">
                        {isDescriptionExpanded ? '一部を表示' : 'もっと見る'}
                    </button>
                </div>
            </div>
            
            <div className="lg:w-1/3 lg:max-w-sm flex-shrink-0">
                <div className="flex flex-col space-y-3">
                    {videoDetails.relatedVideos.map(video => (
                        <RelatedVideoCard key={video.id} video={video} />
                    ))}
                </div>
            </div>

            {isPlaylistModalOpen && (
                <PlaylistModal 
                    isOpen={isPlaylistModalOpen}
                    onClose={() => setIsPlaylistModalOpen(false)}
                    video={videoForPlaylistModal}
                />
            )}
        </div>
    );
};

export default VideoPlayerPage;
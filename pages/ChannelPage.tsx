
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getChannelDetails, getChannelVideos, getChannelPlaylists, searchVideos } from '../utils/api';
import type { ChannelDetails, Video, ApiPlaylist } from '../types';
import VideoGrid from '../components/VideoGrid';
import VideoCardSkeleton from '../components/icons/VideoCardSkeleton';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useApiKey } from '../contexts/ApiKeyContext';
import { PlaylistIcon } from '../components/icons/Icons';

type Tab = 'home' | 'videos' | 'shorts' | 'playlists';

const useInfiniteScroll = (callback: () => void, hasMore: boolean) => {
    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: HTMLDivElement | null) => {
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                callback();
            }
        });
        if (node) observer.current.observe(node);
    }, [callback, hasMore]);
    return lastElementRef;
};

const ChannelPage: React.FC = () => {
    const { channelId } = useParams<{ channelId: string }>();
    const { apiKey } = useApiKey();
    const [channelDetails, setChannelDetails] = useState<ChannelDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('videos');

    const [videos, setVideos] = useState<Video[]>([]);
    const [shorts, setShorts] = useState<Video[]>([]);
    const [playlists, setPlaylists] = useState<ApiPlaylist[]>([]);

    const [videosPageToken, setVideosPageToken] = useState<string | undefined>();
    const [shortsPageToken, setShortsPageToken] = useState<string | undefined>();
    const [playlistsPageToken, setPlaylistsPageToken] = useState<string | undefined>();

    const [isTabLoading, setIsTabLoading] = useState(false);
    
    const { isSubscribed, subscribe, unsubscribe } = useSubscription();

    useEffect(() => {
        const loadInitialDetails = async () => {
            if (!channelId || !apiKey) return;
            setIsLoading(true);
            setError(null);
            try {
                const details = await getChannelDetails(apiKey, channelId);
                setChannelDetails(details);
            } catch (err: any) {
                setError(err.message || 'チャンネルデータの読み込みに失敗しました。');
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialDetails();
    }, [channelId, apiKey]);
    
    const fetchTabData = useCallback(async (tab: Tab, pageToken?: string) => {
        if (!channelId || !apiKey || isTabLoading) return;
        setIsTabLoading(true);

        try {
            switch (tab) {
                case 'videos':
                    const vData = await getChannelVideos(apiKey, channelId, pageToken);
                    setVideos(prev => pageToken ? [...prev, ...vData.videos] : vData.videos);
                    setVideosPageToken(vData.nextPageToken);
                    break;
                case 'shorts':
                    const sData = await searchVideos(apiKey, `#shorts`, pageToken, channelId);
                    setShorts(prev => pageToken ? [...prev, ...sData.videos] : sData.videos);
                    setShortsPageToken(sData.nextPageToken);
                    break;
                case 'playlists':
                    const pData = await getChannelPlaylists(apiKey, channelId, pageToken);
                    setPlaylists(prev => pageToken ? [...prev, ...pData.playlists] : pData.playlists);
                    setPlaylistsPageToken(pData.nextPageToken);
                    break;
            }
        } catch (err) {
            console.error(`Failed to load ${tab}`, err);
        } finally {
            setIsTabLoading(false);
        }
    }, [apiKey, channelId, isTabLoading]);
    
    useEffect(() => {
        if(channelId && apiKey) {
            setVideos([]); setShorts([]); setPlaylists([]);
            setVideosPageToken(undefined); setShortsPageToken(undefined); setPlaylistsPageToken(undefined);
            fetchTabData(activeTab);
        }
    }, [activeTab, channelId, apiKey]); // eslint-disable-line react-hooks/exhaustive-deps


    const handleLoadMore = () => {
        switch (activeTab) {
            case 'videos': if (videosPageToken) fetchTabData('videos', videosPageToken); break;
            case 'shorts': if (shortsPageToken) fetchTabData('shorts', shortsPageToken); break;
            case 'playlists': if (playlistsPageToken) fetchTabData('playlists', playlistsPageToken); break;
        }
    };
    
    const lastElementRef = useInfiniteScroll(handleLoadMore, !!(videosPageToken || shortsPageToken || playlistsPageToken));

    if (isLoading) return <div className="text-center p-8">読み込み中...</div>;
    if (error) return <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">{error}</div>;
    if (!channelDetails) return null;

    const subscribed = isSubscribed(channelDetails.id);
    const handleSubscription = () => subscribed ? unsubscribe(channelDetails.id) : subscribe(channelDetails);

    const TabButton: React.FC<{tab: Tab, label: string}> = ({tab, label}) => (
        <button 
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold text-sm ${activeTab === tab ? 'border-b-2 border-black dark:border-white' : 'text-yt-light-gray'}`}
        >
            {label}
        </button>
    )

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
            
            <div className="border-b border-yt-spec-light-20 dark:border-yt-spec-20">
                <nav className="flex space-x-4">
                    <TabButton tab="videos" label="動画" />
                    <TabButton tab="shorts" label="ショート" />
                    <TabButton tab="playlists" label="再生リスト" />
                </nav>
            </div>

            <div className="mt-6">
                {activeTab === 'videos' && <VideoGrid videos={videos} isLoading={isTabLoading && videos.length === 0} />}
                {activeTab === 'shorts' && <VideoGrid videos={shorts} isLoading={isTabLoading && shorts.length === 0} />}
                {activeTab === 'playlists' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {playlists.map(p => (
                            <Link key={p.id} to={`/playlist?list=${p.id}`} className="group">
                                <div className="relative aspect-video bg-yt-dark-gray rounded-lg overflow-hidden">
                                    <img src={p.thumbnailUrl} alt={p.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                        <div className="text-center text-white">
                                            <PlaylistIcon />
                                            <p className="font-semibold">{p.videoCount} 本の動画</p>
                                        </div>
                                    </div>
                                </div>
                                <h3 className="font-semibold mt-2">{p.title}</h3>
                            </Link>
                        ))}
                    </div>
                )}
                 <div ref={lastElementRef} className="h-10">
                    {isTabLoading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8 mt-8">
                            {Array.from({ length: 5 }).map((_, index) => <VideoCardSkeleton key={index} />)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChannelPage;

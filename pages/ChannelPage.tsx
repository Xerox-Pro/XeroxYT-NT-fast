import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getNewChannelPageData, getChannelPlaylists, searchVideos, getPlaylistDetails } from '../utils/api';
import type { ChannelDetails, Video, ApiPlaylist, Channel } from '../types';
import VideoGrid from '../components/VideoGrid';
import VideoCardSkeleton from '../components/icons/VideoCardSkeleton';
import { useSubscription } from '../contexts/SubscriptionContext';
import { usePlaylist } from '../contexts/PlaylistContext';
import { PlaylistIcon, AddToPlaylistIcon } from '../components/icons/Icons';

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
    const [channelDetails, setChannelDetails] = useState<ChannelDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('videos');

    const [videos, setVideos] = useState<Video[]>([]);
    const [shorts, setShorts] = useState<Video[]>([]);
    const [playlists, setPlaylists] = useState<ApiPlaylist[]>([]);
    const [savingPlaylistId, setSavingPlaylistId] = useState<string | null>(null);

    const [shortsPageToken, setShortsPageToken] = useState<string | undefined>(undefined);
    const [playlistsPageToken, setPlaylistsPageToken] = useState<string | undefined>(undefined);

    const [isTabLoading, setIsTabLoading] = useState(false);
    const isFetchingRef = useRef(false);
    
    const { isSubscribed, subscribe, unsubscribe } = useSubscription();
    const { createPlaylist } = usePlaylist();

    useEffect(() => {
        const loadInitialData = async () => {
            if (!channelId) return;
            setIsLoading(true);
            setError(null);
            try {
                const { details, videos: initialVideos } = await getNewChannelPageData(channelId);
                setChannelDetails(details);
                setVideos(initialVideos);

                // Reset other tab data on channel change
                setShorts([]);
                setPlaylists([]);
                setShortsPageToken(undefined);
                setPlaylistsPageToken(undefined);
            } catch (err: any) {
                setError(err.message || 'チャンネルデータの読み込みに失敗しました。');
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [channelId]);
    
    const fetchTabData = useCallback(async (tab: Tab, pageToken?: string) => {
        if (!channelId || isFetchingRef.current) return;
        if (tab === 'videos' && !pageToken) return; // Videos already loaded, unless paginating

        isFetchingRef.current = true;
        setIsTabLoading(true);

        try {
            switch (tab) {
                case 'shorts':
                    const sData = await searchVideos(`#shorts`, pageToken, channelId);
                    setShorts(prev => pageToken ? [...prev, ...sData.videos] : sData.videos);
                    setShortsPageToken(sData.nextPageToken);
                    break;
                case 'playlists':
                    const pData = await getChannelPlaylists(channelId, pageToken);
                    setPlaylists(prev => pageToken ? [...prev, ...pData.playlists] : pData.playlists);
                    setPlaylistsPageToken(pData.nextPageToken);
                    break;
            }
        } catch (err) {
            console.error(`Failed to load ${tab}`, err);
        } finally {
            setIsTabLoading(false);
            isFetchingRef.current = false;
        }
    }, [channelId]);
    
    useEffect(() => {
        if (isLoading) return;
        if (activeTab === 'videos' && videos.length > 0) return;
        if (activeTab === 'shorts' && shorts.length > 0) return;
        if (activeTab === 'playlists' && playlists.length > 0) return;

        fetchTabData(activeTab);

    }, [activeTab, isLoading, videos, shorts, playlists, fetchTabData]);


    const handleLoadMore = () => {
        switch (activeTab) {
            case 'shorts': if (shortsPageToken) fetchTabData('shorts', shortsPageToken); break;
            case 'playlists': if (playlistsPageToken) fetchTabData('playlists', playlistsPageToken); break;
        }
    };

    const handleSavePlaylist = async (playlist: ApiPlaylist) => {
        if (savingPlaylistId === playlist.id || !playlist.author || !playlist.authorId) return;
        setSavingPlaylistId(playlist.id);
        try {
            const details = await getPlaylistDetails(playlist.id);
            const videoIds = details.videos.map(v => v.id);
            const playlistName = `${playlist.title}`;
            createPlaylist(playlistName, videoIds, playlist.author, playlist.authorId);
            alert(`プレイリスト「${playlistName}」をライブラリに保存しました。`);
        } catch (error) {
            console.error("Failed to save playlist:", error);
            alert("プレイリストの保存に失敗しました。");
        } finally {
            setSavingPlaylistId(null);
        }
    };
    
    const lastElementRef = useInfiniteScroll(handleLoadMore, !!(shortsPageToken || playlistsPageToken));

    if (isLoading) return <div className="text-center p-8">読み込み中...</div>;
    if (error) return <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">{error}</div>;
    if (!channelDetails) return null;

    const subscribed = isSubscribed(channelDetails.id);
    const handleSubscriptionToggle = () => {
        if (!channelDetails.avatarUrl) return;

        const channel: Channel = {
            id: channelDetails.id,
            name: channelDetails.name,
            avatarUrl: channelDetails.avatarUrl,
            subscriberCount: channelDetails.subscriberCount
        };

        if (subscribed) {
            unsubscribe(channel.id);
        } else {
            subscribe(channel);
        }
    };

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
                    <div className="text-sm text-yt-light-gray mt-1 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-x-2">
                        {channelDetails.handle && <span>@{channelDetails.handle}</span>}
                        {channelDetails.subscriberCount && <span>{channelDetails.subscriberCount}</span>}
                        {channelDetails.videoCount > 0 && <span>動画 {channelDetails.videoCount}本</span>}
                    </div>
                    {channelDetails.description && (
                        <p className="text-sm text-yt-light-gray mt-2 line-clamp-2">
                            {channelDetails.description.split('\n')[0]}
                        </p>
                    )}
                </div>
                 <button 
                  onClick={handleSubscriptionToggle}
                  className={`mt-4 sm:mt-0 font-semibold px-4 h-10 rounded-full text-sm flex items-center transform transition-transform duration-150 active:scale-95 ${subscribed ? 'bg-yt-light dark:bg-yt-dark-gray text-black dark:text-white' : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'}`}
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
                {activeTab === 'videos' && <VideoGrid videos={videos} isLoading={isTabLoading && videos.length === 0} hideChannelInfo={true} />}
                {activeTab === 'shorts' && <VideoGrid videos={shorts} isLoading={isTabLoading && shorts.length === 0} hideChannelInfo={true} />}
                {activeTab === 'playlists' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {playlists.map(p => (
                            <div key={p.id} className="group relative">
                                <Link to={`/playlist/${p.id}`}>
                                    <div className="relative aspect-video bg-yt-dark-gray rounded-lg overflow-hidden">
                                        {p.thumbnailUrl ? (
                                            <img src={p.thumbnailUrl} alt={p.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-yt-gray" />
                                        )}
                                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                            <div className="text-center text-white">
                                                <PlaylistIcon />
                                                <p className="font-semibold">{p.videoCount} 本の動画</p>
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="font-semibold mt-2">{p.title}</h3>
                                </Link>
                                <button
                                    onClick={() => handleSavePlaylist(p)}
                                    className="absolute top-2 right-2 p-2 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                    title="ライブラリに保存"
                                    disabled={savingPlaylistId === p.id}
                                >
                                    <AddToPlaylistIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                 <div ref={lastElementRef} className="h-10">
                    {isTabLoading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 mt-8">
                            {Array.from({ length: 5 }).map((_, index) => <VideoCardSkeleton key={index} />)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChannelPage;

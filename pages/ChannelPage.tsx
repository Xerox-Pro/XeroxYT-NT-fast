import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getChannelDetails, getChannelVideos, getChannelPlaylists, getPlaylistDetails, getChannelShorts } from '../utils/api';
import type { ChannelDetails, Video, ApiPlaylist, Channel } from '../types';
import VideoGrid from '../components/VideoGrid';
import VideoCardSkeleton from '../components/icons/VideoCardSkeleton';
import { useSubscription } from '../contexts/SubscriptionContext';
import { usePlaylist } from '../contexts/PlaylistContext';
import { PlaylistIcon, AddToPlaylistIcon } from '../components/icons/Icons';

type Tab = 'videos' | 'shorts' | 'playlists';

// ★★★ 無限スクロールのためのカスタムフックを定義 ★★★
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
    
    // ★★★ 無限スクロールのための状態変数を追加 ★★★
    const [videosPageToken, setVideosPageToken] = useState<string | undefined>('1');
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const [savingPlaylistId, setSavingPlaylistId] = useState<string | null>(null);
    const [isTabLoading, setIsTabLoading] = useState(false);
    
    const { isSubscribed, subscribe, unsubscribe } = useSubscription();
    const { createPlaylist } = usePlaylist();

    useEffect(() => {
        const loadInitialDetails = async () => {
            if (!channelId) return;
            setIsLoading(true);
            setError(null);
            setVideos([]);
            setShorts([]);
            setPlaylists([]);
            setVideosPageToken('1'); // ページトークンをリセット
            setActiveTab('videos');
            try {
                const details = await getChannelDetails(channelId);
                setChannelDetails(details);
            } catch (err: any) {
                setError(err.message || 'チャンネルデータの読み込みに失敗しました。');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialDetails();
    }, [channelId]);
    
    const fetchTabData = useCallback(async (tab: Tab, pageToken?: string) => {
        if (!channelId) return;
        
        // ページトークンがある場合は、タブ全体のローディングではなく、追加取得中フラグを立てる
        if (pageToken && pageToken !== '1') {
            setIsFetchingMore(true);
        } else {
            setIsTabLoading(true);
        }

        try {
            switch (tab) {
                case 'videos':
                    const vData = await getChannelVideos(channelId, pageToken);
                    // ページトークンがあれば追記、なければ新規セット
                    setVideos(prev => pageToken && pageToken !== '1' ? [...prev, ...vData.videos] : vData.videos);
                    setVideosPageToken(vData.nextPageToken);
                    break;
                case 'shorts':
                     if (shorts.length === 0) {
                        const sData = await getChannelShorts(channelId);
                        setShorts(sData.videos);
                    }
                    break;
                case 'playlists':
                    if (playlists.length === 0) {
                        const pData = await getChannelPlaylists(channelId);
                        setPlaylists(pData.playlists);
                    }
                    break;
            }
        } catch (err) {
            console.error(`Failed to load ${tab}`, err);
            setError(`[${tab}] タブの読み込みに失敗しました。`);
        } finally {
            setIsTabLoading(false);
            setIsFetchingMore(false);
        }
    }, [channelId, shorts.length, playlists.length]);
    
    useEffect(() => {
        if (channelId && (activeTab !== 'videos' || videos.length === 0)) {
            fetchTabData(activeTab, '1');
        }
    }, [activeTab, channelId, fetchTabData, videos.length]);

    // ★★★ 無限スクロールのコールバック関数を定義 ★★★
    const handleLoadMore = useCallback(() => {
        if (activeTab === 'videos' && videosPageToken && !isFetchingMore) {
            fetchTabData('videos', videosPageToken);
        }
    }, [activeTab, videosPageToken, isFetchingMore, fetchTabData]);

    const lastElementRef = useInfiniteScroll(handleLoadMore, !!videosPageToken);

    // (handleSavePlaylist, JSXのヘッダー部分は変更なし)
    const handleSavePlaylist = async (playlist: ApiPlaylist) => { /* ... */ };
    if (isLoading) return <div className="text-center p-8">チャンネル情報を読み込み中...</div>;
    if (error && !channelDetails) return <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">{error}</div>;
    if (!channelDetails) return null;
    const subscribed = isSubscribed(channelDetails.id);
    const handleSubscriptionToggle = () => { /* ... */ };
    const TabButton: React.FC<{tab: Tab, label: string}> = ({tab, label}) => ( <button onClick={() => setActiveTab(tab)} className={`...`}>{label}</button> );
    
    const renderTabContent = () => {
        if (isTabLoading && activeTab !== 'videos') {
            return ( <div className="grid grid-cols-1 ..."><VideoCardSkeleton/></div> );
        }

        switch (activeTab) {
            case 'videos':
                // 最初のロード中もスケルトンを表示
                if (isTabLoading && videos.length === 0) {
                    return ( <div className="grid grid-cols-1 ..."><VideoCardSkeleton/></div> );
                }
                return videos.length > 0 ? (
                    <>
                        <VideoGrid videos={videos} isLoading={false} hideChannelInfo={true} />
                        {/* ★★★ 監視対象の要素と、追加ロード中のインジケーターを追加 ★★★ */}
                        <div ref={lastElementRef} className="h-10 flex justify-center items-center">
                            {isFetchingMore && <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yt-blue"></div>}
                        </div>
                    </>
                ) : <div className="text-center p-8">このチャンネルには動画がありません。</div>;
            case 'shorts':
                // (変更なし)
                return shorts.length > 0 ? <VideoGrid videos={shorts} isLoading={false} hideChannelInfo={true} /> : <div className="text-center p-8">このチャンネルにはショート動画がありません。</div>;
            case 'playlists':
                // (変更なし)
                return playlists.length > 0 ? ( <div className="grid ...">{playlists.map(p => ( <div key={p.id}>...</div> ))}</div> ) : <div className="text-center p-8">このチャンネルには再生リストがありません。</div>;
            default:
                return null;
        }
    };

    return (
        <div>
            {/* (チャンネルヘッダー部分は変更なし) */}
            {channelDetails.bannerUrl && ( <div className="..."><img ... /></div> )}
            <div className="flex ...">
                <img ... />
                <div className="flex-1 ...">
                    <h1 className="...">{channelDetails.name}</h1>
                    <div className="text-sm ...">
                        {channelDetails.handle && <span>@{channelDetails.handle}</span>}
                        {channelDetails.subscriberCount && channelDetails.subscriberCount !== '非公開' && <span>チャンネル登録者数 {channelDetails.subscriberCount}</span>}
                        {channelDetails.videoCount > 0 && <span>動画 {channelDetails.videoCount.toLocaleString()}本</span>}
                    </div>
                    {channelDetails.description && ( <p className="...">{channelDetails.description.split('\n')[0]}</p> )}
                </div>
                 <button onClick={handleSubscriptionToggle} className={`...`}>{subscribed ? '登録済み' : 'チャンネル登録'}</button>
            </div>
            
            <div className="border-b ...">
                <nav className="flex space-x-4">
                    <TabButton tab="videos" label="動画" />
                    <TabButton tab="shorts" label="ショート" />
                    <TabButton tab="playlists" label="再生リスト" />
                </nav>
            </div>

            <div className="mt-6">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default ChannelPage;

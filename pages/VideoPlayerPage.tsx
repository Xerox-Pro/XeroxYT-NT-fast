import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getVideoDetails, getEmbedKey, getVideoComments, getVideosByIds } from '../utils/api';
import type { VideoDetails, Comment as CommentType, Channel, Playlist, Video } from '../types';
import VideoPlayerPageSkeleton from '../components/skeletons/VideoPlayerPageSkeleton';
import RelatedVideoCard from '../components/RelatedVideoCard';
import PlaylistModal from '../components/PlaylistModal';
import Comment from '../components/Comment';
import { LikeIcon, SaveIcon, MoreIconHorizontal, LikeIconFilled, MusicNoteIcon } from '../components/icons/Icons';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useHistory } from '../contexts/HistoryContext';
import { usePlaylist } from '../contexts/PlaylistContext';

const PlaylistVideoCard: React.FC<{ video: Video; playlistId: string; index: number; isActive: boolean; }> = ({ video, playlistId, index, isActive }) => {
  return (
    <Link 
      to={`/watch?v=${video.id}&list=${playlistId}`} 
      className={`flex group cursor-pointer p-2 rounded-lg ${isActive ? 'bg-yt-spec-light-10 dark:bg-yt-spec-10' : 'hover:bg-yt-spec-light-10/50 dark:hover:bg-yt-spec-10/50'}`}
    >
      <span className="text-yt-light-gray w-6 text-center self-center">{index}</span>
      <div className="relative w-28 flex-shrink-0 rounded-lg overflow-hidden ml-2">
        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-auto aspect-video object-cover" />
        {video.duration && (
            <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded">
            {video.duration}
            </span>
        )}
      </div>
      <div className="ml-3 flex-1">
        <h3 className="text-black dark:text-white text-sm font-semibold leading-snug break-words max-h-10 overflow-hidden line-clamp-2">
          {video.title}
        </h3>
        <p className="text-yt-light-gray text-xs mt-1">{video.channelName}</p>
      </div>
    </Link>
  );
};

const VideoPlayerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const videoId = searchParams.get('v');
  const playlistId = searchParams.get('list');
  
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [embedKey, setEmbedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [videoDetailsError, setVideoDetailsError] = useState<string | null>(null);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  const { isSubscribed, subscribe, unsubscribe } = useSubscription();
  const { addVideoToHistory } = useHistory();
  const { playlists } = usePlaylist();

  const [playlistVideos, setPlaylistVideos] = useState<Video[]>([]);
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(false);

  const playlist = useMemo(() => playlists.find(p => p.id === playlistId) || null, [playlists, playlistId]);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchAllData = async () => {
      if (!videoId) {
        setError("動画IDが見つかりません。");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setIsCommentsLoading(true);
      setError(null);
      setVideoDetails(null);
      setComments([]);
      setEmbedKey(null);
      setVideoDetailsError(null);
      setCommentsError(null);

      const keyPromise = getEmbedKey();
      const detailsPromise = getVideoDetails(videoId);
      const commentsPromise = getVideoComments(videoId);

      commentsPromise
        .then(setComments)
        .catch(err => {
            console.error("Failed to fetch comments", err);
            setCommentsError("コメントの読み込みに失敗しました。");
        })
        .finally(() => {
            setIsCommentsLoading(false);
        });

      try {
        const key = await keyPromise;
        setEmbedKey(key);

        try {
            const details = await detailsPromise;
            setVideoDetails(details);
            if (details) addVideoToHistory(details);
        } catch (err: any) {
            console.error("Failed to fetch video details:", err);
            setVideoDetailsError(err.message || "動画情報の取得に失敗しました。");
        }

      } catch (err: any) {
        setError(err.message || 'プレーヤーの読み込みに失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [videoId, addVideoToHistory]);

  useEffect(() => {
    if (playlist) {
        setIsPlaylistLoading(true);
        setPlaylistVideos([]);
        getVideosByIds(playlist.videoIds)
            .then(fetchedVideos => {
                const videoMap = new Map(fetchedVideos.map(v => [v.id, v]));
                const orderedVideos = playlist.videoIds.map(id => videoMap.get(id)).filter((v): v is Video => !!v);
                setPlaylistVideos(orderedVideos);
            })
            .finally(() => setIsPlaylistLoading(false));
    }
  }, [playlist]);

  if (isLoading) return <VideoPlayerPageSkeleton />;
  if (error) return <div className="text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg text-center">{error}</div>;
  if (!videoId || !embedKey) return <div className="text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg text-center">{error || '動画プレーヤーの読み込みに失敗しました。'}</div>;

  const { title, channel, views, uploadedAt, likes, relatedVideos, description, superTitleLinks } = videoDetails || {};
  const subscribed = channel ? isSubscribed(channel.id) : false;

  const handleSubscriptionToggle = () => {
    if (!channel) return;
    if (subscribed) {
        unsubscribe(channel.id);
    } else {
        subscribe(channel);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  }

  const playlistVideoIdsStr = useMemo(() => playlist ? playlist.videoIds.join(',') : '', [playlist]);

  const embedSrc = `https://www.youtubeeducation.com/embed/${videoId}${embedKey}${playlistVideoIdsStr ? `&playlist=${playlistVideoIdsStr}` : ''}`;

  return (
    <>
    {isPlaylistModalOpen && videoId && (
      <PlaylistModal videoId={videoId} onClose={() => setIsPlaylistModalOpen(false)} />
    )}
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-grow lg:w-2/3">
        <div className="w-full aspect-video bg-black rounded-xl mb-4 flex items-center justify-center overflow-hidden">
          <iframe
            src={embedSrc}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
        
        {videoDetails && channel ? (
            <>
                {superTitleLinks && superTitleLinks.length > 0 && (
                    <div className="mb-2 text-sm text-yt-blue flex items-center gap-x-2">
                        {superTitleLinks.map((link, index) => (
                            <Link key={index} to={link.url} className="hover:underline">{link.text}</Link>
                        ))}
                    </div>
                )}
                <h1 className="text-2xl font-bold mb-3">{title}</h1>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                    <div className="flex items-center mb-3 md:mb-0">
                        <Link to={`/channel/${channel.id}`}>
                          <img src={channel.avatarUrl} alt={channel.name} className="w-10 h-10 rounded-full" />
                        </Link>
                        <div className="ml-3">
                            <Link to={`/channel/${channel.id}`} className="font-semibold flex items-center gap-1.5">
                                {channel.name}
                                {channel.badges?.map((badge, i) => (
                                    badge.type === 'AUDIO_BADGE' && (
                                        <span key={i} title={badge.tooltip}>
                                            <MusicNoteIcon className="fill-current text-yt-icon dark:text-yt-light-gray" />
                                        </span>
                                    )
                                ))}
                            </Link>
                            <p className="text-sm text-yt-light-gray">{channel.subscriberCount}</p>
                        </div>
                        <button 
                          onClick={handleSubscriptionToggle}
                          className={`ml-6 font-semibold px-4 h-10 rounded-full text-sm flex items-center transition-opacity ${subscribed ? 'bg-yt-light dark:bg-yt-dark-gray text-black dark:text-white' : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'}`}
                        >
                          {subscribed ? '登録済み' : 'チャンネル登録'}
                        </button>
                    </div>
                    <div className="flex items-center space-x-2 flex-wrap">
                        <button onClick={handleLike} className="flex items-center gap-2 px-4 h-10 bg-yt-light dark:bg-yt-dark-gray rounded-full hover:bg-yt-spec-light-20 dark:hover:bg-yt-spec-20 transition-colors">
                            {isLiked ? <LikeIconFilled /> : <LikeIcon />}
                            <span className="text-sm font-semibold">{likes}</span>
                        </button>
                        <button 
                          onClick={() => setIsPlaylistModalOpen(true)}
                          className="flex items-center bg-yt-light dark:bg-yt-dark-gray rounded-full px-4 h-10 hover:bg-yt-spec-light-20 dark:hover:bg-yt-spec-20 transition-colors text-sm font-semibold"
                        >
                            <SaveIcon/>
                            <span className="ml-2">保存</span>
                        </button>
                        <button className="flex items-center justify-center h-10 w-10 bg-yt-light dark:bg-yt-dark-gray rounded-full hover:bg-yt-spec-light-20 dark:hover:bg-yt-spec-20 transition-colors">
                            <MoreIconHorizontal />
                        </button>
                    </div>
                </div>

                <div className="bg-yt-light dark:bg-yt-dark-gray p-3 rounded-xl mt-4 hover:bg-yt-spec-light-20 dark:hover:bg-yt-spec-20 transition-colors">
                    <div onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} className="cursor-pointer">
                      <p className="font-semibold text-sm">{views} • {uploadedAt}</p>
                      <div 
                          className={`text-sm mt-2 whitespace-pre-wrap ${!isDescriptionExpanded ? 'line-clamp-3' : ''} prose prose-sm dark:prose-invert prose-a:text-yt-blue prose-a:hover:underline`}
                          dangerouslySetInnerHTML={{ __html: description || '' }} 
                      />
                      <button className="font-semibold text-sm mt-2">
                          {isDescriptionExpanded ? '一部を表示' : '...もっと見る'}
                      </button>
                    </div>
                </div>
            </>
        ) : videoDetailsError ? (
            <div className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 p-3 rounded-xl mt-4">
                <p className="font-semibold text-sm">動画情報の取得に失敗しました</p>
                <p className="text-sm mt-1">{videoDetailsError}</p>
            </div>
        ) : (
            <div className="bg-yt-light dark:bg-yt-dark-gray p-3 rounded-xl mt-4">
                <p className="font-semibold text-sm">動画情報を読み込めませんでした。</p>
                <p className="text-sm mt-2">この動画は視聴できますが、タイトルや説明などの詳細を表示できません。</p>
            </div>
        )}
        
        <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">
                {isCommentsLoading 
                    ? 'コメントを読み込み中...' 
                    : commentsError
                    ? 'コメント'
                    : `${comments.length}件のコメント`}
            </h2>
            {commentsError ? (
                <div className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 p-3 rounded-lg">
                    {commentsError}
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.map(comment => (
                        <Comment key={comment.id} comment={comment} />
                    ))}
                </div>
            )}
        </div>

      </div>
      
      <div className="w-full lg:w-1/3 lg:max-w-md flex-shrink-0">
        {playlist ? (
            <div className="bg-yt-light dark:bg-yt-dark-gray p-3 rounded-xl">
                <div className="px-2">
                    <h2 className="font-bold text-lg mb-2 truncate">{playlist.name}</h2>
                    <p className="text-sm text-yt-light-gray mb-4">
                        {playlist.videoIds.indexOf(videoId || '') + 1} / {playlist.videoIds.length}
                    </p>
                </div>
                <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                    {isPlaylistLoading 
                        ? <div className="text-center p-4">読み込み中...</div>
                        : playlistVideos.map((video, index) => (
                            <PlaylistVideoCard 
                                key={`${video.id}-${index}`} 
                                video={video} 
                                playlistId={playlist.id} 
                                index={index + 1} 
                                isActive={video.id === videoId} 
                            />
                        ))}
                </div>
            </div>
        ) : (
            <>
                <h2 className="font-bold text-lg mb-4">次の動画</h2>
                <div className="space-y-3">
                    {relatedVideos && relatedVideos.map(video => (
                        <RelatedVideoCard key={video.id} video={video} />
                    ))}
                </div>
            </>
        )}
      </div>
    </div>
    </>
  );
};

export default VideoPlayerPage;
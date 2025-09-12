
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getVideoDetails, getEmbedKey } from '../utils/api';
import type { VideoDetails } from '../types';
import VideoPlayerPageSkeleton from '../components/skeletons/VideoPlayerPageSkeleton';
import RelatedVideoCard from '../components/RelatedVideoCard';
import PlaylistModal from '../components/PlaylistModal';
import { LikeIcon, DislikeIcon, ShareIcon, SaveIcon, MoreIconHorizontal, LikeIconFilled, DislikeIconFilled } from '../components/icons/Icons';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useHistory } from '../contexts/HistoryContext';

const VideoPlayerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const videoId = searchParams.get('v');
  const playlistId = searchParams.get('playlist');
  
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [embedKey, setEmbedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);

  const { isSubscribed, subscribe, unsubscribe } = useSubscription();
  const { addVideoToHistory } = useHistory();

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchAllData = async () => {
      if (!videoId) {
        setError("動画IDが見つかりません。");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      setVideoDetails(null);

      try {
        const [details, key] = await Promise.all([
            getVideoDetails(videoId),
            getEmbedKey()
        ]);
        setVideoDetails(details);
        setEmbedKey(key);
        if (details) {
            addVideoToHistory(details);
        }
      } catch (err: any) {
        setError(err.message || '動画の読み込みに失敗しました。後でもう一度お試しください。');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [videoId, addVideoToHistory]);

  if (isLoading) return <VideoPlayerPageSkeleton />;
  if (error) return <div className="text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg text-center">{error}</div>;
  if (!videoDetails || !embedKey) return null;

  const { title, channel, views, uploadedAt, likes, relatedVideos, description } = videoDetails;
  const subscribed = isSubscribed(channel.id);

  const handleSubscription = () => {
    if (subscribed) {
      unsubscribe(channel.id);
    } else {
      subscribe(channel);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (isDisliked) setIsDisliked(false);
  }

  const handleDislike = () => {
    setIsDisliked(!isDisliked);
    if (isLiked) setIsLiked(false);
  }

  const embedSrc = `https://www.youtubeeducation.com/embed/${videoId}${embedKey}${playlistId ? `&playlist=${playlistId}` : ''}`;


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
        
        <h1 className="text-2xl font-bold mb-3">{title}</h1>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex items-center mb-3 md:mb-0">
                <Link to={`/channel/${channel.id}`}>
                  <img src={channel.avatarUrl} alt={channel.name} className="w-10 h-10 rounded-full" />
                </Link>
                <div className="ml-3">
                    <Link to={`/channel/${channel.id}`} className="font-semibold">{channel.name}</Link>
                    <p className="text-sm text-yt-light-gray">{channel.subscriberCount}</p>
                </div>
                <button 
                  onClick={handleSubscription}
                  className={`ml-6 font-semibold px-4 h-10 rounded-full text-sm hover:opacity-90 flex items-center transition-opacity ${subscribed ? 'bg-yt-light dark:bg-yt-dark-gray text-black dark:text-white' : 'bg-black dark:bg-white text-white dark:text-black'}`}
                >
                  {subscribed ? '登録済み' : 'チャンネル登録'}
                </button>
            </div>
            <div className="flex items-center space-x-2 flex-wrap">
                <div className="flex items-center rounded-full h-10 bg-yt-light dark:bg-yt-dark-gray">
                    <button onClick={handleLike} className="flex items-center gap-2 pl-4 pr-3 h-full hover:bg-yt-spec-light-20 dark:hover:bg-yt-spec-20 rounded-l-full transition-colors">
                        {isLiked ? <LikeIconFilled /> : <LikeIcon />}
                        <span className="text-sm font-semibold">{likes}</span>
                    </button>
                    <div className="w-px h-6 bg-yt-spec-light-20 dark:bg-yt-spec-20"></div>
                    <button onClick={handleDislike} className="flex items-center px-3 h-full hover:bg-yt-spec-light-20 dark:hover:bg-yt-spec-20 rounded-r-full transition-colors">
                        {isDisliked ? <DislikeIconFilled /> : <DislikeIcon />}
                    </button>
                </div>
                <button className="flex items-center bg-yt-light dark:bg-yt-dark-gray rounded-full px-4 h-10 hover:bg-yt-spec-light-20 dark:hover:bg-yt-spec-20 transition-colors text-sm font-semibold">
                    <ShareIcon />
                    <span className="ml-2">共有</span>
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
                  dangerouslySetInnerHTML={{ __html: description }} 
              />
              <button className="font-semibold text-sm mt-2">
                  {isDescriptionExpanded ? '一部を表示' : '...もっと見る'}
              </button>
            </div>
        </div>
      </div>
      
      <div className="w-full lg:w-1/3 lg:max-w-md flex-shrink-0">
        <h2 className="font-bold text-lg mb-4">次の動画</h2>
        <div className="space-y-3">
            {relatedVideos.map(video => (
                <RelatedVideoCard key={video.id} video={video} />
            ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default VideoPlayerPage;
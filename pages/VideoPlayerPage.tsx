import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getVideoDetails } from '../utils/api';
import type { VideoDetails } from '../types';
import VideoPlayerPageSkeleton from '../components/skeletons/VideoPlayerPageSkeleton';
import RelatedVideoCard from '../components/RelatedVideoCard';
import Comment from '../components/Comment';
import PlaylistModal from '../components/PlaylistModal';
import { LikeIcon, DislikeIcon, ShareIcon, SaveIcon, MoreIconHorizontal } from '../components/icons/Icons';
import { useSubscription } from '../contexts/SubscriptionContext';

const parseDescription = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const hashtagRegex = /#(\w+)/g;

  const parts = text
    .replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-yt-blue">${url}</a>`)
    .replace(hashtagRegex, (hashtag, tag) => `<a href="https://www.youtube.com/results?search_query=${encodeURIComponent(tag)}" target="_blank" rel="noopener noreferrer" class="text-yt-blue">${hashtag}</a>`)
    .split('\n');
    
  return parts;
};


const VideoPlayerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const videoId = searchParams.get('v');
  
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

  const { isSubscribed, subscribe, unsubscribe } = useSubscription();

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchDetails = async () => {
      if (!videoId) {
        setError("動画IDが見つかりません。");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      setVideoDetails(null);
      try {
        const details = await getVideoDetails(videoId);
        setVideoDetails(details);
      } catch (err: any) {
        setError(err.message || '動画の読み込みに失敗しました。後でもう一度お試しください。');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [videoId]);

  const descriptionParts = useMemo(() => {
    if (videoDetails?.description) {
      return parseDescription(videoDetails.description);
    }
    return [];
  }, [videoDetails?.description]);


  if (isLoading) return <VideoPlayerPageSkeleton />;
  if (error) return <div className="text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg text-center">{error}</div>;
  if (!videoDetails) return null;

  const { title, channel, views, uploadedAt, likes, relatedVideos, comments } = videoDetails;
  const subscribed = isSubscribed(channel.id);

  const handleSubscription = () => {
    if (subscribed) {
      unsubscribe(channel.id);
    } else {
      subscribe(channel);
    }
  };

  return (
    <>
    {isPlaylistModalOpen && videoId && (
      <PlaylistModal videoId={videoId} onClose={() => setIsPlaylistModalOpen(false)} />
    )}
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-grow lg:w-2/3">
        <div className="w-full aspect-video bg-black rounded-xl mb-4 flex items-center justify-center overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
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
                  className={`ml-6 font-semibold px-4 h-10 rounded-full text-sm hover:opacity-90 flex items-center transform transition-transform duration-150 active:scale-95 ${subscribed ? 'bg-yt-light dark:bg-yt-dark-gray text-black dark:text-white' : 'bg-black dark:bg-white text-white dark:text-black'}`}
                >
                  {subscribed ? '登録済み' : 'チャンネル登録'}
                </button>
            </div>
            <div className="flex items-center space-x-2 flex-wrap">
                <div className="flex items-center bg-yt-light dark:bg-yt-dark-gray rounded-full h-10">
                    <button className="flex items-center px-4 h-full hover:bg-yt-spec-light-20 dark:hover:bg-yt-spec-20 active:bg-yt-spec-light-20 dark:active:bg-yt-spec-20 rounded-l-full transform transition-transform duration-150 active:scale-95">
                        <LikeIcon />
                        <span className="ml-2 text-sm font-semibold">{likes}</span>
                    </button>
                    <div className="w-px h-6 bg-yt-spec-light-20 dark:bg-yt-spec-20"></div>
                    <button className="flex items-center px-4 h-full hover:bg-yt-spec-light-20 dark:hover:bg-yt-spec-20 active:bg-yt-spec-light-20 dark:active:bg-yt-spec-20 rounded-r-full transform transition-transform duration-150 active:scale-95">
                        <DislikeIcon />
                    </button>
                </div>
                <button className="flex items-center bg-yt-light dark:bg-yt-dark-gray rounded-full px-4 h-10 hover:bg-yt-spec-light-20 dark:hover:bg-yt-spec-20 active:bg-yt-spec-light-20 dark:active:bg-yt-spec-20 text-sm font-semibold transform transition-transform duration-150 active:scale-95">
                    <ShareIcon />
                    <span className="ml-2">共有</span>
                </button>
                <button 
                  onClick={() => setIsPlaylistModalOpen(true)}
                  className="flex items-center bg-yt-light dark:bg-yt-dark-gray rounded-full px-4 h-10 hover:bg-yt-spec-light-20 dark:hover:bg-yt-spec-20 active:bg-yt-spec-light-20 dark:active:bg-yt-spec-20 text-sm font-semibold transform transition-transform duration-150 active:scale-95"
                >
                    <SaveIcon/>
                    <span className="ml-2">保存</span>
                </button>
                <button className="flex items-center justify-center h-10 w-10 bg-yt-light dark:bg-yt-dark-gray rounded-full hover:bg-yt-spec-light-20 dark:hover:bg-yt-spec-20 active:bg-yt-spec-light-20 dark:active:bg-yt-spec-20 transform transition-transform duration-150 active:scale-95">
                    <MoreIconHorizontal />
                </button>
            </div>
        </div>

        <div className="bg-yt-light dark:bg-yt-dark-gray p-3 rounded-xl mt-4 hover:bg-yt-spec-light-20 dark:hover:bg-yt-spec-20 transition-colors">
            <div onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} className="cursor-pointer">
              <p className="font-semibold text-sm">{views} • {uploadedAt}</p>
              <div className={`text-sm mt-2 whitespace-pre-wrap ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
                  {descriptionParts.map((part, index) => (
                    <span key={index} dangerouslySetInnerHTML={{ __html: part + '<br/>' }} />
                  ))}
              </div>
              <button className="font-semibold text-sm mt-2">
                  {isDescriptionExpanded ? '一部を表示' : '...もっと見る'}
              </button>
            </div>
        </div>

        <div className="mt-6">
            <h2 className="font-bold text-lg mb-4">コメント{comments.length}件</h2>
            <div className="space-y-4">
                {comments.map(comment => <Comment key={comment.id} comment={comment} />)}
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
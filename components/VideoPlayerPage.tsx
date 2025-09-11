import React, { useState, useEffect } from 'react';
import { getVideoDetails } from '../utils/api';
import type { VideoDetails } from '../types';
import VideoPlayerPageSkeleton from './skeletons/VideoPlayerPageSkeleton';
import RelatedVideoCard from './RelatedVideoCard';
import Comment from './Comment';
import { LikeIcon, DislikeIcon, ShareIcon, DownloadIcon, MoreIconHorizontal } from './icons/Icons';

interface VideoPlayerPageProps {
  videoId: string;
  onSelectVideo: (videoId: string) => void;
}

const VideoPlayerPage: React.FC<VideoPlayerPageProps> = ({ videoId, onSelectVideo }) => {
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      setVideoDetails(null);
      try {
        const details = await getVideoDetails(videoId);
        setVideoDetails(details);
      } catch (err) {
        setError('Failed to load video details. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [videoId]);

  if (isLoading) return <VideoPlayerPageSkeleton />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!videoDetails) return null;

  const { title, channel, views, uploadedAt, likes, description, relatedVideos, comments } = videoDetails;

  return (
    <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-6 lg:px-8">
      {/* Main content */}
      <div className="flex-grow lg:w-2/3">
        {/* Video Player Placeholder */}
        <div className="w-full aspect-video bg-yt-dark rounded-xl mb-4 flex items-center justify-center">
            <p className="text-yt-light-gray">Video Player Placeholder</p>
        </div>
        
        {/* Video Title */}
        <h1 className="text-xl font-bold mb-3">{title}</h1>

        {/* Channel Info and Actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex items-center mb-3 md:mb-0">
                <img src={channel.avatarUrl} alt={channel.name} className="w-10 h-10 rounded-full" />
                <div className="ml-3">
                    <p className="font-semibold">{channel.name}</p>
                    <p className="text-sm text-yt-light-gray">{channel.subscriberCount}</p>
                </div>
                <button className="ml-6 bg-white text-black font-semibold px-4 py-2 rounded-full text-sm">Subscribe</button>
            </div>
            <div className="flex items-center space-x-2">
                <div className="flex items-center bg-yt-dark rounded-full">
                    <button className="flex items-center px-4 py-2 hover:bg-yt-dark-gray rounded-l-full">
                        <LikeIcon />
                        <span className="ml-2 text-sm font-semibold">{likes}</span>
                    </button>
                    <div className="w-px h-6 bg-yt-dark-gray"></div>
                    <button className="px-4 py-2 hover:bg-yt-dark-gray rounded-r-full">
                        <DislikeIcon />
                    </button>
                </div>
                <button className="flex items-center bg-yt-dark rounded-full px-4 py-2 hover:bg-yt-dark-gray text-sm font-semibold">
                    <ShareIcon />
                    <span className="ml-2">Share</span>
                </button>
                <button className="flex items-center bg-yt-dark rounded-full px-4 py-2 hover:bg-yt-dark-gray text-sm font-semibold">
                    <DownloadIcon/>
                    <span className="ml-2">Download</span>
                </button>
                <button className="p-2 bg-yt-dark rounded-full hover:bg-yt-dark-gray">
                    <MoreIconHorizontal />
                </button>
            </div>
        </div>

        {/* Description */}
        <div className="bg-yt-dark p-3 rounded-xl mt-4 cursor-pointer" onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
            <p className="font-semibold text-sm">{views} &bull; {uploadedAt}</p>
            <p className={`text-sm mt-2 whitespace-pre-wrap ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
                {description}
            </p>
            <button className="font-semibold text-sm mt-2">
                {isDescriptionExpanded ? 'Show less' : '...more'}
            </button>
        </div>

        {/* Comments */}
        <div className="mt-6">
            <h2 className="font-bold text-lg mb-4">{comments.length} Comments</h2>
            <div className="space-y-4">
                {comments.map(comment => <Comment key={comment.id} comment={comment} />)}
            </div>
        </div>
      </div>
      
      {/* Related Videos */}
      <div className="w-full lg:w-1/3 lg:max-w-md flex-shrink-0">
        <h2 className="font-bold text-lg mb-4">Up next</h2>
        <div className="space-y-3">
            {relatedVideos.map(video => (
                <RelatedVideoCard key={video.id} video={video} onSelectVideo={onSelectVideo} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerPage;
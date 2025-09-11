import React from 'react';
import type { Video } from '../types';
import VideoCard from './VideoCard';
import VideoCardSkeleton from './skeletons/VideoCardSkeleton';

interface VideoGridProps {
  videos: Video[];
  onSelectVideo: (videoId: string) => void;
  isLoading: boolean;
}

const VideoGrid: React.FC<VideoGridProps> = ({ videos, onSelectVideo, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
        {Array.from({ length: 20 }).map((_, index) => (
          <VideoCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!videos.length) {
    return <div className="text-center col-span-full">No videos found.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
      {videos.map(video => (
        <VideoCard key={video.id} video={video} onSelectVideo={onSelectVideo} />
      ))}
    </div>
  );
};

export default VideoGrid;
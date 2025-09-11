import React from 'react';
import type { Video } from '../types';

interface VideoCardProps {
  video: Video;
  onSelectVideo: (videoId: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onSelectVideo }) => {
  return (
    <div className="flex flex-col group cursor-pointer" onClick={() => onSelectVideo(video.id)}>
      <div className="relative">
        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-auto aspect-video rounded-xl object-cover group-hover:rounded-none transition-all duration-200" />
        <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1.5 py-0.5 rounded">
          {video.duration}
        </span>
      </div>
      <div className="flex mt-3">
        <div className="flex-shrink-0">
          <img src={video.channelAvatarUrl} alt={video.channelName} className="w-9 h-9 rounded-full" />
        </div>
        <div className="ml-3">
          <h3 className="text-white text-base font-medium leading-snug break-words max-h-12 overflow-hidden">
            {video.title}
          </h3>
          <p className="text-yt-light-gray text-sm mt-1">{video.channelName}</p>
          <p className="text-yt-light-gray text-sm">
            {video.views} &bull; {video.uploadedAt}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
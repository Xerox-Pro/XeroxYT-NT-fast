import React from 'react';
import { Link } from 'react-router-dom';
import type { Video } from '../types';

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const handleChannelLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <Link to={`/watch?v=${video.id}`} className="flex flex-col group cursor-pointer">
      <div className="relative rounded-xl overflow-hidden">
        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-auto aspect-video object-cover group-hover:scale-105 transition-transform duration-300" />
        <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1.5 py-0.5 rounded-md">
          {video.duration}
        </span>
      </div>
      <div className="flex mt-3">
        <div className="flex-shrink-0">
          <Link to={`/channel/${video.channelId}`} onClick={handleChannelLinkClick}>
            <img src={video.channelAvatarUrl} alt={video.channelName} className="w-9 h-9 rounded-full" />
          </Link>
        </div>
        <div className="ml-3">
          <h3 className="text-black dark:text-white text-lg font-medium leading-snug break-words max-h-14 overflow-hidden">
            {video.title}
          </h3>
          <Link to={`/channel/${video.channelId}`} onClick={handleChannelLinkClick} className="text-yt-light-gray text-sm mt-1 hover:text-black dark:hover:text-white">
            {video.channelName}
          </Link>
          <p className="text-yt-light-gray text-sm">
            {video.views} &bull; {video.uploadedAt}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;
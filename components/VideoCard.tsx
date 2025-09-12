import React from 'react';
import { Link } from 'react-router-dom';
import type { Video } from '../types';

interface VideoCardProps {
  video: Video;
  hideChannelInfo?: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, hideChannelInfo = false }) => {
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
        {!hideChannelInfo && video.channelId && (
          <div className="flex-shrink-0">
            <Link to={`/channel/${video.channelId}`} onClick={handleChannelLinkClick}>
              <img src={video.channelAvatarUrl} alt={video.channelName} className="w-9 h-9 rounded-full" />
            </Link>
          </div>
        )}
        <div className={!hideChannelInfo && video.channelId ? 'ml-3' : ''}>
          <h3 className="text-black dark:text-white text-base font-medium leading-snug break-words max-h-12 overflow-hidden line-clamp-2">
            {video.title}
          </h3>
          <div className="text-yt-light-gray text-sm mt-1">
            {!hideChannelInfo && video.channelId && (
                <Link to={`/channel/${video.channelId}`} onClick={handleChannelLinkClick} className="hover:text-black dark:hover:text-white block">
                    {video.channelName}
                </Link>
            )}
            <p>
              {[video.views?.includes('不明') ? null : video.views, video.uploadedAt].filter(Boolean).join(' \u2022 ')}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;
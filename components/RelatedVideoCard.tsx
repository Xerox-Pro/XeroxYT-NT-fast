import React from 'react';
import { Link } from 'react-router-dom';
import type { Video } from '../types';

interface RelatedVideoCardProps {
  video: Video;
}

const RelatedVideoCard: React.FC<RelatedVideoCardProps> = ({ video }) => {
  return (
    <Link to={`/watch?v=${video.id}`} className="flex group cursor-pointer">
      <div className="relative w-40 flex-shrink-0 rounded-lg overflow-hidden">
        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-auto aspect-video object-cover group-hover:scale-105 transition-transform duration-300" />
        <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded">
          {video.duration}
        </span>
      </div>
      <div className="ml-3">
        <h3 className="text-black dark:text-white text-sm font-semibold leading-snug break-words max-h-10 overflow-hidden">
          {video.title}
        </h3>
        <p className="text-yt-light-gray text-xs mt-1">{video.channelName}</p>
        <p className="text-yt-light-gray text-xs">
          {[video.views, video.uploadedAt].filter(Boolean).join(' \u2022 ')}
        </p>
      </div>
    </Link>
  );
};

export default RelatedVideoCard;
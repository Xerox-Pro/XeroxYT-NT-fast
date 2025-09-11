import React from 'react';
import { Link } from 'react-router-dom';
import type { Video } from '../types';

interface SearchVideoResultCardProps {
  video: Video;
}

const SearchVideoResultCard: React.FC<SearchVideoResultCardProps> = ({ video }) => {
  return (
    <Link to={`/watch?v=${video.id}`} className="flex flex-col sm:flex-row gap-4 group cursor-pointer">
      <div className="relative flex-shrink-0 sm:w-64 md:w-80 rounded-xl overflow-hidden">
        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-auto aspect-video object-cover group-hover:scale-105 transition-transform duration-300" />
        <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1.5 py-0.5 rounded-md">
          {video.duration}
        </span>
      </div>
      <div className="flex-1">
        <h3 className="text-black dark:text-white text-xl font-medium leading-snug break-words max-h-14 overflow-hidden">
          {video.title}
        </h3>
        <p className="text-yt-light-gray text-sm mt-2">
            {[video.views, video.uploadedAt].filter(Boolean).join(' \u2022 ')}
        </p>
        <div className="flex items-center mt-3">
          <Link to={`/channel/${video.channelId}`} className="flex-shrink-0" onClick={e => e.stopPropagation()}>
            <img src={video.channelAvatarUrl} alt={video.channelName} className="w-9 h-9 rounded-full" />
          </Link>
          <Link to={`/channel/${video.channelId}`} className="text-yt-light-gray text-sm ml-3 hover:text-black dark:hover:text-white" onClick={e => e.stopPropagation()}>
            {video.channelName}
          </Link>
        </div>
      </div>
    </Link>
  );
};

export default SearchVideoResultCard;
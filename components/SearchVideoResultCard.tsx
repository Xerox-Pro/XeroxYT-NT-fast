
import React from 'react';
import { Link } from 'react-router-dom';
import type { Video } from '../types';

interface SearchVideoResultCardProps {
  video: Video;
}

const SearchVideoResultCard: React.FC<SearchVideoResultCardProps> = ({ video }) => {
  return (
    <Link to={`/watch/${video.id}`} className="flex flex-col sm:flex-row gap-4 group">
      {/* Thumbnail */}
      <div className="relative flex-shrink-0 sm:w-64 md:w-80 rounded-xl overflow-hidden">
        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-auto aspect-video object-cover group-hover:scale-105 transition-transform duration-300" />
        <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1.5 py-0.5 rounded-md">
          {video.duration}
        </span>
      </div>

      {/* Video Details */}
      <div className="flex-1">
        <h3 className="text-black dark:text-white text-xl font-medium leading-snug break-words max-h-14 overflow-hidden line-clamp-2">
          {video.title}
        </h3>
        <p className="text-yt-light-gray text-sm mt-2">
            {[video.views?.includes('不明') ? null : video.views, video.uploadedAt].filter(Boolean).join(' \u2022 ')}
        </p>

        {/* Channel Info */}
        {video.channelId && (
            <div className="flex items-center mt-3">
              <Link to={`/channel/${video.channelId}`} className="flex items-center group/channel" onClick={e => e.stopPropagation()}>
                {video.channelAvatarUrl ? (
                    <img src={video.channelAvatarUrl} alt={video.channelName} className="w-6 h-6 rounded-full mr-2" />
                ) : (
                    <div className="w-6 h-6 rounded-full mr-2 bg-yt-gray"></div>
                )}
                <span className="text-yt-light-gray text-sm group-hover/channel:text-black dark:group-hover/channel:text-white">{video.channelName}</span>
              </Link>
            </div>
        )}

        {/* Description Snippet */}
        {video.descriptionSnippet && (
            <p className="text-yt-light-gray text-sm mt-3 line-clamp-2">
                {video.descriptionSnippet}
            </p>
        )}
      </div>
    </Link>
  );
};

export default SearchVideoResultCard;

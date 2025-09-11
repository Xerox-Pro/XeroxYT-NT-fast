import React from 'react';
import type { Video } from '../types';

interface RelatedVideoCardProps {
  video: Video;
  onSelectVideo: (videoId: string) => void;
}

const RelatedVideoCard: React.FC<RelatedVideoCardProps> = ({ video, onSelectVideo }) => {
  return (
    <div className="flex group cursor-pointer" onClick={() => onSelectVideo(video.id)}>
      <div className="relative w-40 flex-shrink-0">
        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-auto aspect-video rounded-lg object-cover" />
        <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded">
          {video.duration}
        </span>
      </div>
      <div className="ml-3">
        <h3 className="text-white text-sm font-semibold leading-snug break-words max-h-10 overflow-hidden">
          {video.title}
        </h3>
        <p className="text-yt-light-gray text-xs mt-1">{video.channelName}</p>
        <p className="text-yt-light-gray text-xs">
          {video.views} &bull; {video.uploadedAt}
        </p>
      </div>
    </div>
  );
};

export default RelatedVideoCard;

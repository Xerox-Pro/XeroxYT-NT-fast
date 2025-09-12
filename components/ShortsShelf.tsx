import React from 'react';
import type { Video } from '../types';
import ShortsCard from './ShortsCard';
import { ShortsIcon } from './icons/Icons';

const ShortsCardSkeleton: React.FC = () => (
  <div className="w-44 flex-shrink-0 animate-pulse">
    <div className="w-full aspect-[9/16] rounded-xl bg-yt-light dark:bg-yt-dark-gray"></div>
    <div className="mt-2 space-y-2">
      <div className="h-4 bg-yt-light dark:bg-yt-dark-gray rounded w-full"></div>
      <div className="h-4 bg-yt-light dark:bg-yt-dark-gray rounded w-2/3"></div>
    </div>
  </div>
);

interface ShortsShelfProps {
  shorts: Video[];
  isLoading: boolean;
}

const ShortsShelf: React.FC<ShortsShelfProps> = ({ shorts, isLoading }) => {
  return (
    <section>
      <div className="flex items-center mb-4">
        <ShortsIcon />
        <h2 className="text-2xl font-bold ml-3">ショート</h2>
      </div>
      <div className="overflow-hidden">
        <div className="flex flex-nowrap space-x-4 overflow-x-auto pb-4 no-scrollbar">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, index) => <ShortsCardSkeleton key={index} />)
          ) : (
            shorts.map(video => <ShortsCard key={video.id} video={video} />)
          )}
        </div>
      </div>
    </section>
  );
};

export default ShortsShelf;

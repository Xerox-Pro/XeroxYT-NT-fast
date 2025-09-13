import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Playlist, Video } from '../types';
import { ShuffleIcon, RepeatIcon } from './icons/Icons';

interface PlaylistPanelProps {
  playlist: Playlist;
  videos: Video[];
  currentVideoId: string;
  isShuffle: boolean;
  isLoop: boolean;
  toggleShuffle: () => void;
  toggleLoop: () => void;
  onReorder: (startIndex: number, endIndex: number) => void;
}

const PlaylistPanel: React.FC<PlaylistPanelProps> = ({ playlist, videos, currentVideoId, isShuffle, isLoop, toggleShuffle, toggleLoop, onReorder }) => {
  const currentIndex = videos.findIndex(v => v.id === currentVideoId);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    onReorder(dragItem.current, dragOverItem.current);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div className="bg-yt-light dark:bg-yt-dark-gray rounded-xl overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
      <div className="p-4 border-b border-yt-spec-light-20 dark:border-yt-spec-20">
        <h2 className="text-xl font-bold truncate">{playlist.name}</h2>
        <p className="text-sm text-yt-light-gray">{`動画 ${currentIndex >= 0 ? currentIndex + 1 : '-'} / ${videos.length}`}</p>
        <div className="flex items-center gap-2 mt-2">
            <button
                onClick={toggleShuffle}
                className={`p-2 rounded-full hover:bg-yt-spec-light-20 dark:hover:bg-yt-spec-20 ${isShuffle ? 'text-yt-blue' : ''}`}
                title="シャッフル"
            >
                <ShuffleIcon className={`w-6 h-6 ${isShuffle ? 'fill-current text-yt-blue' : 'fill-current text-black dark:text-white'}`} />
            </button>
            <button
                onClick={toggleLoop}
                className={`p-2 rounded-full hover:bg-yt-spec-light-20 dark:hover:bg-yt-spec-20 ${isLoop ? 'text-yt-blue' : ''}`}
                title="リピート"
            >
                <RepeatIcon className={`w-6 h-6 ${isLoop ? 'fill-current text-yt-blue' : 'fill-current text-black dark:text-white'}`}/>
            </button>
        </div>
      </div>
      <div className="overflow-y-auto">
        {videos.map((video, index) => (
          <div
            key={`${video.id}-${index}`}
            className={`flex items-center gap-3 p-2 group cursor-grab ${video.id === currentVideoId ? 'bg-yt-spec-light-20 dark:bg-yt-spec-20' : 'hover:bg-yt-spec-light-10 dark:hover:bg-yt-spec-10'}`}
            draggable
            onDragStart={() => dragItem.current = index}
            onDragEnter={() => dragOverItem.current = index}
            onDragEnd={handleDragSort}
            onDragOver={(e) => e.preventDefault()}
          >
            <span className="text-yt-light-gray text-sm w-6 text-center">{index + 1}</span>
            <Link
              to={`/watch/${video.id}?list=${playlist.id}`}
              className="flex-1 flex items-center gap-3"
              draggable={false}
              onClick={e => e.preventDefault()}
              onDoubleClick={() => window.location.href = `/watch/${video.id}?list=${playlist.id}`}
            >
                <div className="relative w-24 flex-shrink-0">
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full aspect-video rounded-md" draggable={false} />
                    <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded-sm">{video.duration}</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-sm font-semibold truncate">{video.title}</h3>
                  <p className="text-xs text-yt-light-gray truncate">{video.channelName}</p>
                </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaylistPanel;
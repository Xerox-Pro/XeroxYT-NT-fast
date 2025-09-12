import React from 'react';
import { Link } from 'react-router-dom';
import type { Notification } from '../types';
import { formatTimeAgo } from '../utils/api';

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  const { channel, video, publishedAt } = notification;

  return (
    <Link 
      to={`/watch?v=${video.id}`} 
      onClick={onClose}
      className="flex items-start px-4 py-3 hover:bg-yt-spec-light-10 dark:hover:bg-yt-spec-10 border-b border-yt-spec-light-20 dark:border-yt-spec-20 last:border-b-0"
    >
      <div className="flex-shrink-0 mt-1">
        <img src={channel.avatarUrl} alt={channel.name} className="w-10 h-10 rounded-full" />
      </div>
      <div className="ml-4 flex-1">
        <p className="text-sm text-black dark:text-white line-clamp-2">
          <strong>{channel.name}</strong> が新しい動画を公開しました: {video.title}
        </p>
        {/* FIX: The 'publishedAt' property is an ISO string, but 'formatTimeAgo' expects a Unix timestamp (number). Convert the string to a timestamp in seconds before passing it to the function. */}
        <p className="text-xs text-yt-blue mt-1">{formatTimeAgo(new Date(publishedAt).getTime() / 1000)}</p>
      </div>
      <div className="flex-shrink-0 ml-4">
        <img src={video.thumbnailUrl} alt={video.title} className="w-28 aspect-video rounded-md" />
      </div>
    </Link>
  );
};

export default NotificationItem;

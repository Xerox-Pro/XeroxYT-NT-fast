
import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, ShortsIcon, SubscriptionsIcon, HistoryIcon, PlaylistIcon } from './icons/Icons';
import { useSubscription } from '../contexts/SubscriptionContext';

interface SidebarProps {
  isOpen: boolean;
}

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; to: string; }> = ({ icon, label, to }) => (
    <NavLink 
      to={to} 
      end
      className={({ isActive }) => 
        `flex items-center px-3 py-2.5 rounded-lg text-base font-medium ${isActive ? 'bg-yt-spec-light-10 dark:bg-yt-spec-10' : 'hover:bg-yt-spec-light-10 dark:hover:bg-yt-spec-10'}`
      }
    >
        {icon}
        <span className="ml-6 truncate">{label}</span>
    </NavLink>
);

const SmallSidebarItem: React.FC<{ icon: React.ReactNode; label: string; to: string; }> = ({ icon, label, to }) => (
    <NavLink 
      to={to}
      end
      className={({ isActive }) => `flex flex-col items-center justify-center p-2 rounded-lg text-xs w-full hover:bg-yt-spec-light-10 dark:hover:bg-yt-spec-10 ${isActive ? 'bg-yt-spec-light-10 dark:bg-yt-spec-10' : ''}`}
    >
        {icon}
        <span className="mt-1.5">{label}</span>
    </NavLink>
);


const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { subscribedChannels } = useSubscription();

  if (!isOpen) {
    return (
        <div className="fixed top-14 left-0 w-[72px] h-full bg-yt-white dark:bg-yt-black flex flex-col items-center py-2 px-1 space-y-2">
            <SmallSidebarItem to="/" icon={<HomeIcon />} label="ホーム" />
            <SmallSidebarItem to="/shorts" icon={<ShortsIcon />} label="ショート" />
            <SmallSidebarItem to="/subscriptions" icon={<SubscriptionsIcon />} label="登録チャンネル" />
            <SmallSidebarItem to="/you" icon={<PlaylistIcon />} label="プレイリスト" />
        </div>
    );
  }

  return (
    <aside className="fixed top-14 left-0 w-56 h-full bg-yt-white dark:bg-yt-black p-3 pr-2 transition-transform duration-300 ease-in-out z-40 overflow-y-auto">
      <nav className="flex flex-col space-y-1">
        <SidebarItem to="/" icon={<HomeIcon />} label="ホーム" />
        <SidebarItem to="/shorts" icon={<ShortsIcon />} label="ショート" />
        <SidebarItem to="/subscriptions" icon={<SubscriptionsIcon />} label="登録チャンネル" />
      </nav>
      <hr className="my-3 border-yt-spec-light-20 dark:border-yt-spec-20" />
      <nav className="flex flex-col space-y-1">
        <SidebarItem to="/you" icon={<PlaylistIcon />} label="プレイリスト" />
        <SidebarItem to="/history" icon={<HistoryIcon />} label="履歴" />
      </nav>
      {subscribedChannels.length > 0 && (
          <>
            <hr className="my-3 border-yt-spec-light-20 dark:border-yt-spec-20" />
            <h2 className="px-3 py-2 text-lg font-semibold">登録チャンネル</h2>
            <nav className="flex flex-col space-y-1">
                {subscribedChannels.map(channel => (
                    <NavLink
                        key={channel.id}
                        to={`/channel/${channel.id}`}
                        className={({ isActive }) => 
                            `flex items-center px-3 py-2.5 rounded-lg text-base font-medium ${isActive ? 'bg-yt-spec-light-10 dark:bg-yt-spec-10' : 'hover:bg-yt-spec-light-10 dark:hover:bg-yt-spec-10'}`
                        }
                    >
                        <img src={channel.avatarUrl} alt={channel.name} className="w-6 h-6 rounded-full" />
                        <span className="ml-6 truncate">{channel.name}</span>
                    </NavLink>
                ))}
            </nav>
          </>
      )}
    </aside>
  );
};

export default Sidebar;

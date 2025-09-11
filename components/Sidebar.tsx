
import React from 'react';
import { HomeIcon, ShortsIcon, SubscriptionsIcon, YouIcon, HistoryIcon } from './icons/Icons';

interface SidebarProps {
  isOpen: boolean;
}

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean }> = ({ icon, label, active = false }) => (
    <a href="#" className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium ${active ? 'bg-yt-dark' : 'hover:bg-yt-dark'}`}>
        {icon}
        <span className="ml-6">{label}</span>
    </a>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  if (!isOpen) {
    return (
        <div className="fixed top-14 left-0 w-[72px] h-full bg-yt-black flex flex-col items-center py-2 space-y-2">
            <a href="#" className="flex flex-col items-center justify-center p-2 rounded-lg text-xs w-full hover:bg-yt-dark">
                <HomeIcon />
                <span className="mt-1.5">Home</span>
            </a>
            <a href="#" className="flex flex-col items-center justify-center p-2 rounded-lg text-xs w-full hover:bg-yt-dark">
                <ShortsIcon />
                <span className="mt-1.5">Shorts</span>
            </a>
            <a href="#" className="flex flex-col items-center justify-center p-2 rounded-lg text-xs w-full hover:bg-yt-dark">
                <SubscriptionsIcon />
                <span className="mt-1.5">Subscriptions</span>
            </a>
            <a href="#" className="flex flex-col items-center justify-center p-2 rounded-lg text-xs w-full hover:bg-yt-dark">
                <YouIcon />
                <span className="mt-1.5">You</span>
            </a>
        </div>
    );
  }

  return (
    <aside className="fixed top-14 left-0 w-60 h-full bg-yt-black p-3 pr-2 transition-transform duration-300 ease-in-out z-40">
      <nav className="flex flex-col space-y-1">
        <SidebarItem icon={<HomeIcon />} label="Home" active={true} />
        <SidebarItem icon={<ShortsIcon />} label="Shorts" />
        <SidebarItem icon={<SubscriptionsIcon />} label="Subscriptions" />
      </nav>
      <hr className="my-3 border-yt-dark-gray" />
      <nav className="flex flex-col space-y-1">
        <SidebarItem icon={<YouIcon />} label="You" />
        <SidebarItem icon={<HistoryIcon />} label="History" />
      </nav>
    </aside>
  );
};

export default Sidebar;

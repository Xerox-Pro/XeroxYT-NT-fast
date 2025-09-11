
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MenuIcon, YouTubeLogo, SearchIcon, BellIcon, SunIcon, MoonIcon, SettingsIcon } from './icons/Icons';
import { useNotification } from '../contexts/NotificationContext';
import { useApiKey } from '../contexts/ApiKeyContext';
import NotificationDropdown from './NotificationDropdown';

interface HeaderProps {
  toggleSidebar: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, theme, toggleTheme }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { notifications, unreadCount, markAsRead } = useNotification();
  const { openModal } = useApiKey();
  const navigate = useNavigate();
  const notificationRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/results?search_query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleBellClick = () => {
    setIsNotificationOpen(prev => !prev);
    if (!isNotificationOpen && unreadCount > 0) {
        markAsRead();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
            setIsNotificationOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 bg-yt-white dark:bg-yt-black h-14 flex items-center justify-between px-4 z-50">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-yt-spec-light-10 dark:hover:bg-yt-spec-10 active:scale-95 transform transition-transform duration-150" aria-label="サイドバーの切り替え">
          <MenuIcon />
        </button>
        <Link to="/" className="flex items-center" aria-label="YouTubeホーム">
            <YouTubeLogo />
            <div className="hidden sm:flex items-baseline ml-1.5">
                <span className="text-black dark:text-white text-xl font-bold tracking-tighter">XeroxYT-NT</span>
            </div>
        </Link>
      </div>

      {/* Center Section */}
      <div className="flex-1 flex justify-center px-4 lg:px-16">
        <form onSubmit={handleSearch} className="w-full max-w-2xl flex items-center">
          <div className="flex w-full items-center rounded-full border border-yt-gray dark:border-yt-gray focus-within:border-yt-blue transition-colors overflow-hidden">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="検索"
              className="flex-1 h-10 bg-transparent px-4 text-base text-black dark:text-white focus:outline-none"
            />
            <button
                type="submit"
                className="bg-yt-light dark:bg-yt-dark-gray h-10 px-6 border-l border-yt-gray dark:border-yt-gray hover:bg-stone-200 dark:hover:bg-yt-gray active:bg-stone-300 dark:active:bg-yt-gray transition-colors"
                aria-label="検索"
            >
                <SearchIcon />
            </button>
          </div>
        </form>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        <button onClick={openModal} className="p-2 rounded-full hover:bg-yt-spec-light-10 dark:hover:bg-yt-spec-10 active:scale-95 transform transition-transform duration-150" aria-label="APIキー設定">
            <SettingsIcon />
        </button>
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-yt-spec-light-10 dark:hover:bg-yt-spec-10 active:scale-95 transform transition-transform duration-150" aria-label="テーマの切り替え">
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
        <div className="relative" ref={notificationRef}>
            <button onClick={handleBellClick} className="p-2 rounded-full hover:bg-yt-spec-light-10 dark:hover:bg-yt-spec-10 active:scale-95 transform transition-transform duration-150 hidden sm:block" aria-label="通知">
                <BellIcon />
                 {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-yt-red rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
            {isNotificationOpen && <NotificationDropdown notifications={notifications} onClose={() => setIsNotificationOpen(false)} />}
        </div>
        <button className="w-8 h-8 rounded-full bg-yt-icon" aria-label="ユーザーアカウント">
          {/* User Avatar */}
        </button>
      </div>
    </header>
  );
};

export default Header;

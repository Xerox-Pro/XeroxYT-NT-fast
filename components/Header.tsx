import React, { useState } from 'react';
import { MenuIcon, YouTubeLogo, SearchIcon, MicIcon, VideoPlusIcon, BellIcon } from './icons/Icons';

interface HeaderProps {
  toggleSidebar: () => void;
  onSearch: (query: string) => void;
  goHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, onSearch, goHome }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-yt-black h-14 flex items-center justify-between px-4 z-50">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-yt-dark" aria-label="Toggle sidebar">
          <MenuIcon />
        </button>
        <button onClick={goHome} className="flex items-center" aria-label="YouTube Home">
            <YouTubeLogo />
            <span className="text-white text-xl font-semibold tracking-tighter ml-1.5">YouTube</span>
        </button>
      </div>

      {/* Center Section */}
      <div className="flex-1 flex justify-center px-4 lg:px-16">
        <form onSubmit={handleSearch} className="w-full max-w-2xl flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full bg-yt-black border border-yt-dark-gray rounded-l-full px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
          <button type="submit" className="bg-yt-dark px-6 py-2 rounded-r-full border border-yt-dark-gray border-l-0" aria-label="Search">
            <SearchIcon />
          </button>
          <button type="button" className="ml-4 p-2.5 bg-yt-dark rounded-full" aria-label="Search with your voice">
            <MicIcon />
          </button>
        </form>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        <button className="p-2 rounded-full hover:bg-yt-dark" aria-label="Create">
          <VideoPlusIcon />
        </button>
        <button className="p-2 rounded-full hover:bg-yt-dark" aria-label="Notifications">
          <BellIcon />
        </button>
        <button className="w-8 h-8 rounded-full bg-gray-500" aria-label="User account">
          {/* User Avatar */}
        </button>
      </div>
    </header>
  );
};

export default Header;

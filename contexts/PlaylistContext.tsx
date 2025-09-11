
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import type { Playlist } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface PlaylistContextType {
  playlists: Playlist[];
  createPlaylist: (name: string, firstVideoId?: string) => void;
  renamePlaylist: (playlistId: string, newName: string) => void;
  deletePlaylist: (playlistId: string) => void;
  addVideoToPlaylist: (playlistId: string, videoId: string) => void;
  removeVideoFromPlaylist: (playlistId: string, videoId: string) => void;
  isVideoInPlaylist: (playlistId: string, videoId: string) => boolean;
  getPlaylistsContainingVideo: (videoId: string) => string[];
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export const PlaylistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const item = window.localStorage.getItem('playlists');
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.error("Failed to parse playlists from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('playlists', JSON.stringify(playlists));
    } catch (error) {
      console.error("Failed to save playlists to localStorage", error);
    }
  }, [playlists]);

  const createPlaylist = (name: string, firstVideoId?: string) => {
    const newPlaylist: Playlist = {
      id: uuidv4(),
      name,
      videoIds: firstVideoId ? [firstVideoId] : [],
      createdAt: new Date().toISOString(),
    };
    setPlaylists(prev => [newPlaylist, ...prev]);
  };
  
  const renamePlaylist = (playlistId: string, newName: string) => {
    setPlaylists(prev => 
      prev.map(p => (p.id === playlistId ? { ...p, name: newName } : p))
    );
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
  };
  
  const addVideoToPlaylist = (playlistId: string, videoId: string) => {
    setPlaylists(prev => prev.map(p => {
        if (p.id === playlistId && !p.videoIds.includes(videoId)) {
          return { ...p, videoIds: [...p.videoIds, videoId] };
        }
        return p;
      })
    );
  };

  const removeVideoFromPlaylist = (playlistId: string, videoId: string) => {
    setPlaylists(prev => prev.map(p => {
        if (p.id === playlistId) {
          return { ...p, videoIds: p.videoIds.filter(id => id !== videoId) };
        }
        return p;
      })
    );
  };

  const isVideoInPlaylist = (playlistId: string, videoId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    return playlist ? playlist.videoIds.includes(videoId) : false;
  };

  const getPlaylistsContainingVideo = (videoId: string) => {
      return playlists.filter(p => p.videoIds.includes(videoId)).map(p => p.id);
  }

  return (
    <PlaylistContext.Provider value={{ playlists, createPlaylist, renamePlaylist, deletePlaylist, addVideoToPlaylist, removeVideoFromPlaylist, isVideoInPlaylist, getPlaylistsContainingVideo }}>
      {children}
    </PlaylistContext.Provider>
  );
};

export const usePlaylist = (): PlaylistContextType => {
  const context = useContext(PlaylistContext);
  if (context === undefined) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
};

// FIX: Removed local uuidv4 function to resolve conflict with imported library.

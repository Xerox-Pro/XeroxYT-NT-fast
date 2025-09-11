
import React, { useState, useEffect } from 'react';
import { usePlaylist } from '../contexts/PlaylistContext';
import { CloseIcon } from './icons/Icons';

interface PlaylistModalProps {
  videoId: string;
  onClose: () => void;
}

const PlaylistModal: React.FC<PlaylistModalProps> = ({ videoId, onClose }) => {
  const { playlists, createPlaylist, addVideoToPlaylist, removeVideoFromPlaylist, getPlaylistsContainingVideo } = usePlaylist();
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set());
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    setSelectedPlaylists(new Set(getPlaylistsContainingVideo(videoId)));
  }, [videoId, getPlaylistsContainingVideo]);

  const handleCheckboxChange = (playlistId: string) => {
    const newSelection = new Set(selectedPlaylists);
    if (newSelection.has(playlistId)) {
      newSelection.delete(playlistId);
      removeVideoFromPlaylist(playlistId, videoId);
    } else {
      newSelection.add(playlistId);
      addVideoToPlaylist(playlistId, videoId);
    }
    setSelectedPlaylists(newSelection);
  };
  
  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim(), videoId);
      setNewPlaylistName('');
      setShowNewPlaylistInput(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-yt-light-black rounded-lg w-full max-w-sm p-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">プレイリストに保存</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-yt-spec-20">
            <CloseIcon />
          </button>
        </div>
        
        <div className="max-h-60 overflow-y-auto pr-2">
          {playlists.map(playlist => (
            <div key={playlist.id} className="flex items-center mb-2">
              <input 
                type="checkbox"
                id={`playlist-${playlist.id}`}
                checked={selectedPlaylists.has(playlist.id)}
                onChange={() => handleCheckboxChange(playlist.id)}
                className="w-5 h-5 accent-yt-blue"
              />
              <label htmlFor={`playlist-${playlist.id}`} className="ml-3">{playlist.name}</label>
            </div>
          ))}
        </div>

        <hr className="my-3 border-yt-spec-20" />

        {showNewPlaylistInput ? (
          <div>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="プレイリスト名を入力"
              className="w-full h-10 bg-yt-black border border-yt-gray rounded-lg px-3 mb-2 text-white focus:outline-none focus:border-yt-blue"
              autoFocus
            />
            <button
              onClick={handleCreatePlaylist}
              className="w-full bg-yt-blue text-white font-semibold py-2 rounded-lg hover:opacity-90"
            >
              作成
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setShowNewPlaylistInput(true)} 
            className="text-yt-blue font-semibold"
          >
            + 新しいプレイリストを作成
          </button>
        )}
      </div>
    </div>
  );
};

export default PlaylistModal;

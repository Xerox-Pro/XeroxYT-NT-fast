
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlaylist } from '../contexts/PlaylistContext';
import { getVideosByIds } from '../utils/api';
import type { Video } from '../types';
import { EditIcon, TrashIcon } from '../components/icons/Icons';
import { Link } from 'react-router-dom';

const PlaylistPage: React.FC = () => {
    const { playlistId } = useParams<{ playlistId: string }>();
    const navigate = useNavigate();
    const { playlists, renamePlaylist, removeVideoFromPlaylist, deletePlaylist } = usePlaylist();
    
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingName, setIsEditingName] = useState(false);

    const playlist = useMemo(() => playlists.find(p => p.id === playlistId), [playlists, playlistId]);
    const [playlistName, setPlaylistName] = useState(playlist?.name || '');

    useEffect(() => {
        if (!playlist) {
            // Optional: navigate to a 'not found' page or home
            // navigate('/'); 
            return;
        }
        setPlaylistName(playlist.name);
        
        const fetchVideos = async () => {
            setIsLoading(true);
            if (playlist.videoIds.length > 0) {
                const fetchedVideos = await getVideosByIds(playlist.videoIds);
                // Preserve order from playlist
                const videoMap = new Map(fetchedVideos.map(v => [v.id, v]));
                setVideos(playlist.videoIds.map(id => videoMap.get(id)).filter((v): v is Video => !!v));
            } else {
                setVideos([]);
            }
            setIsLoading(false);
        };
        fetchVideos();
    }, [playlist, playlistId, navigate]);

    if (!playlist) {
        return <div className="text-center p-8">プレイリストが見つかりません。</div>;
    }
    
    const handleNameSave = () => {
        if (playlistName.trim() && playlistId) {
            renamePlaylist(playlistId, playlistName.trim());
        }
        setIsEditingName(false);
    }
    
    const handleDeletePlaylist = () => {
        if (window.confirm(`「${playlist.name}」を削除しますか？`)) {
            if(playlistId) deletePlaylist(playlistId);
            navigate('/you');
        }
    }

    return (
        <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 md:max-w-sm flex-shrink-0 bg-yt-dark-gray p-4 rounded-lg self-start">
                {videos.length > 0 ? (
                    <img src={videos[0].thumbnailUrl} alt={playlist.name} className="w-full aspect-video rounded-lg mb-4" />
                ) : (
                    <div className="w-full aspect-video bg-yt-gray rounded-lg mb-4"></div>
                )}
                
                {isEditingName ? (
                    <div className="flex items-center">
                        <input
                            type="text"
                            value={playlistName}
                            onChange={(e) => setPlaylistName(e.target.value)}
                            className="w-full bg-yt-black border-b-2 border-white px-1"
                            autoFocus
                            onBlur={handleNameSave}
                            onKeyDown={e => e.key === 'Enter' && handleNameSave()}
                        />
                    </div>
                ) : (
                    <div className="flex items-center">
                        <h1 className="text-2xl font-bold flex-1 truncate">{playlist.name}</h1>
                        <button onClick={() => setIsEditingName(true)} className="p-2 rounded-full hover:bg-yt-spec-20">
                            <EditIcon />
                        </button>
                    </div>
                )}
                <p className="text-yt-light-gray mt-2">{videos.length} 本の動画</p>
                <button onClick={handleDeletePlaylist} className="p-2 mt-2 rounded-full hover:bg-yt-spec-20">
                    <TrashIcon />
                </button>
            </div>
            <div className="flex-1">
                {isLoading ? (
                    <p>読み込み中...</p>
                ) : videos.length === 0 ? (
                    <p>このプレイリストには動画がありません。</p>
                ) : (
                    <div className="space-y-3">
                        {videos.map((video, index) => (
                            <div key={video.id} className="flex items-center group">
                                <span className="text-yt-light-gray mr-4">{index + 1}</span>
                                <Link to={`/watch?v=${video.id}`} className="flex-1 flex gap-4">
                                    <img src={video.thumbnailUrl} alt={video.title} className="w-32 aspect-video rounded-lg"/>
                                    <div>
                                        <h3 className="font-semibold line-clamp-2">{video.title}</h3>
                                        <p className="text-sm text-yt-light-gray">{video.channelName}</p>
                                    </div>
                                </Link>
                                <button onClick={() => playlistId && removeVideoFromPlaylist(playlistId, video.id)} className="p-2 rounded-full hover:bg-yt-spec-20 opacity-0 group-hover:opacity-100">
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaylistPage;

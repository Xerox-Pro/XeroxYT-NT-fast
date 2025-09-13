import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePlaylist } from '../contexts/PlaylistContext';
import { getVideosByIds } from '../utils/api';
import type { Video } from '../types';
import { EditIcon, TrashIcon, PlayIcon, ShuffleIcon, RepeatIcon } from '../components/icons/Icons';

const PlaylistPage: React.FC = () => {
    const { playlistId } = useParams<{ playlistId: string }>();
    const navigate = useNavigate();
    const { playlists, renamePlaylist, removeVideoFromPlaylist, deletePlaylist, reorderVideosInPlaylist } = usePlaylist();
    
    const playlist = useMemo(() => playlists.find(p => p.id === playlistId), [playlists, playlistId]);
    
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingName, setIsEditingName] = useState(false);
    const [playlistName, setPlaylistName] = useState(playlist?.name || '');

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        if (!playlist) {
            // navigate('/you'); // Redirect if playlist not found
            return;
        }
        setPlaylistName(playlist.name);
        
        const fetchVideos = async () => {
            setIsLoading(true);
            if (playlist.videoIds.length > 0) {
                const fetchedVideos = await getVideosByIds(playlist.videoIds);
                const videoMap = new Map(fetchedVideos.map(v => [v.id, v]));
                setVideos(playlist.videoIds.map(id => videoMap.get(id)).filter((v): v is Video => !!v));
            } else {
                setVideos([]);
            }
            setIsLoading(false);
        };
        fetchVideos();
    }, [playlist, navigate]);

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

    const handleDragSort = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        if (playlistId) {
            reorderVideosInPlaylist(playlistId, dragItem.current, dragOverItem.current);
        }
        dragItem.current = null;
        dragOverItem.current = null;
    };

    return (
        <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 md:max-w-sm flex-shrink-0 bg-gradient-to-b from-yt-gray to-yt-dark-gray p-6 rounded-lg self-start">
                {videos.length > 0 ? (
                    <div className="relative group/playall mb-4">
                        <Link to={`/watch/${videos[0].id}?list=${playlist.id}`}>
                            <img src={videos[0].thumbnailUrl} alt={playlist.name} className="w-full aspect-video rounded-lg" />
                             <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center gap-2 opacity-0 group-hover/playall:opacity-100 transition-opacity cursor-pointer rounded-lg">
                                <PlayIcon className="fill-current text-white h-6 w-6" />
                                <span className="text-white font-semibold text-lg">すべて再生</span>
                            </div>
                        </Link>
                    </div>
                ) : (
                    <div className="w-full aspect-video bg-yt-gray rounded-lg mb-4"></div>
                )}
                
                {isEditingName ? (
                    <div className="flex items-center mb-2">
                        <input
                            type="text"
                            value={playlistName}
                            onChange={(e) => setPlaylistName(e.target.value)}
                            className="w-full bg-transparent border-b-2 border-white px-1 text-2xl font-bold"
                            autoFocus
                            onBlur={handleNameSave}
                            onKeyDown={e => e.key === 'Enter' && handleNameSave()}
                        />
                    </div>
                ) : (
                    <div className="flex items-center mb-2">
                        <h1 className="text-2xl font-bold flex-1 truncate">{playlist.name}</h1>
                        <button onClick={() => setIsEditingName(true)} className="p-2 rounded-full hover:bg-yt-spec-20">
                            <EditIcon />
                        </button>
                    </div>
                )}
                <p className="text-yt-light-gray mt-2 text-sm">{videos.length} 本の動画</p>

                <div className="flex items-center gap-2 mt-4">
                    <button onClick={handleDeletePlaylist} className="p-2 rounded-full hover:bg-yt-spec-20">
                        <TrashIcon />
                    </button>
                    {videos.length > 0 && (
                        <>
                            <Link to={`/watch/${videos[0].id}?list=${playlist.id}&shuffle=1`} className="p-2 rounded-full hover:bg-yt-spec-20">
                                <ShuffleIcon />
                            </Link>
                            <Link to={`/watch/${videos[0].id}?list=${playlist.id}&loop=1`} className="p-2 rounded-full hover:bg-yt-spec-20">
                                <RepeatIcon />
                            </Link>
                        </>
                    )}
                </div>
            </div>
            <div className="flex-1">
                {isLoading ? (
                    <p>読み込み中...</p>
                ) : videos.length === 0 ? (
                    <p>このプレイリストには動画がありません。</p>
                ) : (
                    <div className="space-y-2">
                        {videos.map((video, index) => (
                            <div
                                key={video.id}
                                className="flex items-center group p-2 rounded-md hover:bg-yt-dark-gray cursor-grab"
                                draggable
                                onDragStart={() => dragItem.current = index}
                                onDragEnter={() => dragOverItem.current = index}
                                onDragEnd={handleDragSort}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <span className="text-yt-light-gray mr-4 w-6 text-center">{index + 1}</span>
                                <Link to={`/watch/${video.id}?list=${playlist.id}`} className="flex-1 flex gap-4">
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
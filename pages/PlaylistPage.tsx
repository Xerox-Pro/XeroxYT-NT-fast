import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePlaylist } from '../contexts/PlaylistContext';
import { getVideosByIds } from '../utils/api';
import type { Video } from '../types';
import { EditIcon, TrashIcon, PlayIcon, ShuffleIcon, RepeatIcon, DragHandleIcon, MoreIconHorizontal } from '../components/icons/Icons';

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
    }, [playlist]);

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
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;
        if (playlistId) {
            reorderVideosInPlaylist(playlistId, dragItem.current, dragOverItem.current);
        }
        dragItem.current = null;
        dragOverItem.current = null;
    };
    
    const firstVideoId = videos.length > 0 ? videos[0].id : null;

    return (
        <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 md:max-w-sm flex-shrink-0 bg-gradient-to-b from-yt-gray/50 to-yt-dark-gray p-6 rounded-2xl self-start sticky top-20">
                {videos.length > 0 && firstVideoId ? (
                    <div className="relative group/playall mb-4">
                        <Link to={`/watch/${firstVideoId}?list=${playlist.id}`}>
                            <img src={videos[0].thumbnailUrl} alt={playlist.name} className="w-full aspect-video rounded-lg" />
                             <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center gap-2 opacity-0 group-hover/playall:opacity-100 transition-opacity cursor-pointer rounded-lg">
                                <PlayIcon className="fill-current text-white h-8 w-8" />
                                <span className="text-white font-semibold text-xl">すべて再生</span>
                            </div>
                        </Link>
                    </div>
                ) : (
                    <div className="w-full aspect-video bg-yt-gray rounded-lg mb-4 flex items-center justify-center">
                        <p className="text-yt-light-gray">動画がありません</p>
                    </div>
                )}
                
                {isEditingName ? (
                    <div className="flex items-center mb-2">
                        <input
                            type="text"
                            value={playlistName}
                            onChange={(e) => setPlaylistName(e.target.value)}
                            className="w-full bg-transparent border-b-2 border-white px-1 text-3xl font-bold"
                            autoFocus
                            onBlur={handleNameSave}
                            onKeyDown={e => e.key === 'Enter' && handleNameSave()}
                        />
                    </div>
                ) : (
                    <div className="flex items-start mb-2">
                        <h1 className="text-3xl font-bold flex-1 break-words">{playlist.name}</h1>
                        <button onClick={() => setIsEditingName(true)} className="p-2 rounded-full hover:bg-yt-spec-20 ml-2">
                            <EditIcon />
                        </button>
                    </div>
                )}
                <div className="text-sm text-yt-light-gray mt-2 space-y-1">
                    <p className="font-semibold text-white">{playlist.authorName}</p>
                    <p>{videos.length} 本の動画 \u2022 最終更新 {new Date(playlist.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center gap-2 mt-4">
                     {videos.length > 0 && firstVideoId && (
                        <>
                             <Link to={`/watch/${firstVideoId}?list=${playlist.id}&shuffle=1`} className="p-2 rounded-full hover:bg-yt-spec-20" title="シャッフル">
                                <ShuffleIcon />
                            </Link>
                            <Link to={`/watch/${firstVideoId}?list=${playlist.id}&loop=1`} className="p-2 rounded-full hover:bg-yt-spec-20" title="リピート">
                                <RepeatIcon />
                            </Link>
                        </>
                    )}
                    <button onClick={handleDeletePlaylist} className="p-2 rounded-full hover:bg-yt-spec-20" title="プレイリストを削除">
                        <TrashIcon />
                    </button>
                </div>
            </div>
            <div className="flex-1">
                {isLoading ? (
                    <p>読み込み中...</p>
                ) : videos.length === 0 ? (
                    <p>このプレイリストには動画がありません。</p>
                ) : (
                    <div className="space-y-1">
                        {videos.map((video, index) => (
                            <div
                                key={`${video.id}-${index}`}
                                className="flex items-center group p-2 rounded-md hover:bg-yt-dark-gray"
                                draggable
                                onDragStart={() => dragItem.current = index}
                                onDragEnter={() => dragOverItem.current = index}
                                onDragEnd={handleDragSort}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <div className="flex items-center text-yt-light-gray mr-4">
                                    <span className="w-6 text-center">{index + 1}</span>
                                    <div className="cursor-grab ml-2">
                                        <DragHandleIcon />
                                    </div>
                                </div>
                                <Link to={`/watch/${video.id}?list=${playlist.id}`} className="flex-1 flex gap-4 items-center">
                                    <img src={video.thumbnailUrl} alt={video.title} className="w-32 aspect-video rounded-lg"/>
                                    <div className="flex-1">
                                        <h3 className="font-semibold line-clamp-2">{video.title}</h3>
                                        <p className="text-sm text-yt-light-gray">{video.channelName}</p>
                                    </div>
                                    <p className="text-sm text-yt-light-gray pr-4">{video.duration}</p>
                                </Link>
                                <button onClick={() => playlistId && removeVideoFromPlaylist(playlistId, video.id)} className="p-2 rounded-full hover:bg-yt-spec-20 opacity-0 group-hover:opacity-100" title="プレイリストから削除">
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
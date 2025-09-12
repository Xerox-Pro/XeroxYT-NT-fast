
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePlaylist } from '../contexts/PlaylistContext';
import { getVideosByIds } from '../utils/api';
import type { Playlist } from '../types';
import { PlaylistIcon } from '../components/icons/Icons';

const YouPage: React.FC = () => {
    const { playlists } = usePlaylist();
    const [playlistThumbnails, setPlaylistThumbnails] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchThumbnails = async () => {
            const videoIdsToFetch = playlists
                .map(p => p.videoIds[0])
                .filter((id): id is string => !!id);
            
            if (videoIdsToFetch.length > 0) {
                const videos = await getVideosByIds(videoIdsToFetch);
                const thumbnails: Record<string, string> = {};
                const videoMap = new Map(videos.map(v => [v.id, v.thumbnailUrl]));

                playlists.forEach(p => {
                    if (p.videoIds.length > 0) {
                        const thumb = videoMap.get(p.videoIds[0]);
                        if (thumb) {
                            thumbnails[p.id] = thumb;
                        }
                    }
                });
                setPlaylistThumbnails(thumbnails);
            }
        };

        fetchThumbnails();
    }, [playlists]);

    return (
        <div className="container mx-auto">
            <h1 className="text-2xl font-bold mb-6">プレイリスト</h1>
            
            {playlists.length === 0 ? (
                <p className="text-yt-light-gray">作成したプレイリストはありません。</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {playlists.map(playlist => (
                        <Link key={playlist.id} to={`/playlist/${playlist.id}`} className="group">
                            <div className="relative aspect-video bg-yt-dark-gray rounded-lg overflow-hidden">
                                {playlistThumbnails[playlist.id] ? (
                                    <img src={playlistThumbnails[playlist.id]} alt={playlist.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <PlaylistIcon />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                    <div className="text-center text-white">
                                        <PlaylistIcon />
                                        <p className="font-semibold">{playlist.videoIds.length} 本の動画</p>
                                    </div>
                                </div>
                            </div>
                            <h3 className="font-semibold mt-2">{playlist.name}</h3>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default YouPage;
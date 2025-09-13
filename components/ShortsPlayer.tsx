import React, { useState, useEffect } from 'react';
import type { Video } from '../types';
import { Link } from 'react-router-dom';
import { LikeIcon, DislikeIcon, ShareIcon, MoreIconHorizontal, CommentIcon } from './icons/Icons';
import { getEmbedUrlKey } from '../utils/api';


const ShortsPlayer: React.FC<{ video: Video }> = ({ video }) => {
    const viewsText = video.views.includes('不明') ? '...' : video.views.split('回')[0];
    const [embedUrl, setEmbedUrl] = useState<string>('');

    useEffect(() => {
        const constructEmbedUrl = async () => {
            if (!video.id) return;
            try {
                const key = await getEmbedUrlKey();
                const params = new URLSearchParams(key.startsWith('?') ? key.substring(1) : '');
                params.set('controls', '0');
                params.set('loop', '1');
                params.set('playlist', video.id);
                params.set('modestbranding', '1');
                setEmbedUrl(`https://www.youtubeeducation.com/embed/${video.id}?${params.toString()}`);
            } catch {
                setEmbedUrl(`https://www.youtube.com/embed/${video.id}?controls=0&loop=1&playlist=${video.id}&modestbranding=1&rel=0`);
            }
        };
        constructEmbedUrl();
    }, [video.id]);

    return (
        <div className="h-full w-full max-w-[400px] aspect-[9/16] relative snap-start flex-shrink-0 rounded-2xl overflow-hidden bg-yt-black">
            {embedUrl && (
                <iframe
                    src={embedUrl}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                ></iframe>
            )}
            
            {/* Overlay Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white bg-gradient-to-t from-black/70 to-transparent">
                <div className="flex items-center">
                    <Link to={`/channel/${video.channelId}`} className="flex items-center flex-1">
                        <img src={video.channelAvatarUrl} alt={video.channelName} className="w-10 h-10 rounded-full" />
                        <span className="ml-3 font-semibold truncate">{video.channelName}</span>
                    </Link>
                    <button className="bg-white text-black font-semibold px-4 py-2 rounded-full text-sm flex-shrink-0">
                        登録
                    </button>
                </div>
                <p className="mt-2 text-sm line-clamp-2">{video.title}</p>
            </div>

            {/* Side Actions */}
            <div className="absolute bottom-20 right-2 flex flex-col items-center space-y-4">
                <button className="flex flex-col items-center p-2 rounded-full bg-black/50">
                    <LikeIcon />
                    <span className="text-xs mt-1">{viewsText}</span>
                </button>
                <button className="flex flex-col items-center p-2 rounded-full bg-black/50">
                    <DislikeIcon />
                    <span className="text-xs mt-1">低評価</span>
                </button>
                <button className="flex flex-col items-center p-2 rounded-full bg-black/50">
                    <CommentIcon />
                    <span className="text-xs mt-1">...</span>
                </button>
                <button className="flex flex-col items-center p-2 rounded-full bg-black/50">
                    <ShareIcon />
                    <span className="text-xs mt-1">共有</span>
                </button>
                <button className="p-2 rounded-full bg-black/50">
                    <MoreIconHorizontal />
                </button>
            </div>
        </div>
    );
};
export default ShortsPlayer;

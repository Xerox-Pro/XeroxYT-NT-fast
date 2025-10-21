import { YouTube } from 'youtubei.js';
import type { Video, VideoDetails, Channel, ChannelDetails, ApiPlaylist, Comment, PlaylistDetails } from '../types'; // 既存の型定義

// YouTubei.jsのインスタンスを初期化
// 本来はサーバーサイドで実行するか、バックエンドAPI経由で利用するのが望ましい
// ここでは簡易的にグローバルにインスタンスを持つ
let youtube: YouTube | null = null;

const getYouTubeInstance = async (): Promise<YouTube> => {
    if (!youtube) {
        youtube = await YouTube.create();
    }
    return youtube;
};

// --- HELPER FUNCTIONS ---
const formatNumber = (num: number | string | undefined): string => {
    if (typeof num === 'string') {
        const parsedNum = parseInt(num.replace(/[^0-9]/g, ''), 10);
        if (isNaN(parsedNum)) return '0';
        num = parsedNum;
    }
    if (isNaN(num as number) || num === undefined) return '0';
    const n = num as number;

    if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}億`;
    if (n >= 10_000) return `${Math.floor(n / 10_000)}万`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}千`;
    return n.toLocaleString();
};

const formatDuration = (totalSeconds: number | undefined): string => {
    if (isNaN(totalSeconds as number) || (totalSeconds as number) < 0 || totalSeconds === undefined) return "0:00";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(((totalSeconds as number) % 3600) / 60);
    const seconds = (totalSeconds as number) % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export const formatTimeAgo = (publishedText: string | undefined): string => {
    if (!publishedText) return '';
    // YouTubei.jsのpublished_dateは文字列の場合が多いので、そのまま返すか、より複雑なパースが必要
    // 厳密な変換が必要ならdate-fnsなどのライブラリを検討
    return publishedText;
};

// --- DATA MAPPING HELPERS (YouTubei.jsの出力に合わせて調整) ---
const mapYouTubeiVideoToVideo = (item: any): Video | null => {
    if (!item || !item.id) return null;
    const duration = item.duration?.seconds || 0;
    
    return {
        id: item.id,
        thumbnailUrl: item.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
        duration: formatDuration(duration),
        isoDuration: `PT${duration}S`,
        title: item.title,
        channelName: item.author?.name || '不明なチャンネル',
        channelId: item.author?.id || '',
        channelAvatarUrl: item.author?.thumbnails?.[0]?.url || '',
        views: `${formatNumber(item.views)}回視聴`,
        uploadedAt: formatTimeAgo(item.published?.text || item.published), // YouTubei.jsのpublished_dateはテキストの場合がある
        descriptionSnippet: item.description_snippet || '',
    };
};

// --- EXPORTED API FUNCTIONS ---

export async function getRecommendedVideos(): Promise<{ videos: Video[] }> {
    const youtube = await getYouTubeInstance();
    try {
        const homeFeed = await youtube.getHomeFeed();
        const videos: Video[] = homeFeed.videos
            .map(mapYouTubeiVideoToVideo)
            .filter((v): v is Video => v !== null);
        return { videos };
    } catch (error) {
        console.error("Failed to fetch recommended videos using YouTubei.js:", error);
        throw new Error('おすすめ動画の取得に失敗しました。');
    }
}

export async function searchVideos(query: string, pageToken = '', channelId?: string): Promise<{ videos: Video[], nextPageToken?: string }> {
    const youtube = await getYouTubeInstance();
    try {
        let results;
        if (pageToken) {
            results = await youtube.continueSearch({continuation: pageToken});
        } else {
            results = await youtube.search(query, { type: 'video' });
        }
        
        let videos: Video[] = results.videos
            .map(mapYouTubeiVideoToVideo)
            .filter((v): v is Video => v !== null);

        if (channelId) {
            videos = videos.filter(v => v.channelId === channelId);
        }
        
        const nextPageToken = results.continuation?.token; // ページネーションのcontinuationトークン
        return { videos, nextPageToken };
    } catch (error) {
        console.error(`Failed to search videos for query: ${query} using YouTubei.js`, error);
        throw new Error('検索結果の取得に失敗しました。');
    }
}

export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
    const youtube = await getYouTubeInstance();
    try {
        const video = await youtube.getVideo(videoId);
        if (!video) {
            throw new Error('動画は利用できません。');
        }

        const channel: Channel = {
            id: video.author?.id || '',
            name: video.author?.name || '不明なチャンネル',
            avatarUrl: video.author?.thumbnails?.[0]?.url || '',
            subscriberCount: video.author?.subscribers?.text || '非公開',
            badges: video.author?.badges?.map((b: any) => ({ type: b.style, tooltip: b.tooltip })) || [],
        };

        // YouTubei.jsから関連動画を取得
        const relatedVideos: Video[] = (video.related || [])
            .map(mapYouTubeiVideoToVideo)
            .filter((v): v is Video => v !== null);
        
        return {
            id: video.id,
            thumbnailUrl: video.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
            duration: formatDuration(video.duration?.seconds),
            isoDuration: `PT${video.duration?.seconds || 0}S`,
            title: video.title,
            channelName: channel.name,
            channelId: channel.id,
            channelAvatarUrl: channel.avatarUrl,
            views: `${formatNumber(video.views)}回視聴`,
            uploadedAt: formatTimeAgo(video.published?.text || video.published),
            description: video.description?.text || '',
            likes: formatNumber(video.likes),
            dislikes: '0', // YouTubeはdislike countを公開していないため、0とする
            channel: channel,
            relatedVideos: relatedVideos,
        };
    } catch (error: any) {
        console.error(`Failed to fetch video details for ${videoId} using YouTubei.js:`, error);
        throw new Error(error.message || '動画詳細の取得に失敗しました。');
    }
}

export async function getComments(videoId: string): Promise<Comment[]> {
    const youtube = await getYouTubeInstance();
    try {
        const comments = await youtube.getComments(videoId);
        if (!comments || !comments.contents) {
            return [];
        }
        return comments.contents.map((comment: any): Comment => ({
            id: comment.id,
            authorName: comment.author?.name || '不明',
            authorThumbnailUrl: comment.author?.thumbnails?.[0]?.url || '',
            text: comment.text?.text || '',
            publishedTime: formatTimeAgo(comment.published || ''),
            likes: comment.likes ? formatNumber(comment.likes) : '0',
            // YouTubei.jsは返信コメントも取得可能ですが、ここでは単純化のため親コメントのみをマッピング
        }));
    } catch (error) {
        console.error(`Failed to fetch comments for video ${videoId} using YouTubei.js:`, error);
        return [];
    }
}

export async function getVideosByIds(videoIds: string[]): Promise<Video[]> {
    if (videoIds.length === 0) return [];
    const youtube = await getYouTubeInstance();
    const promises = videoIds.map(id => youtube.getVideo(id).then(mapYouTubeiVideoToVideo).catch(err => {
        console.error(`Failed to fetch video ${id} using YouTubei.js`, err); return null;
    }));
    const results = await Promise.all(promises);
    return results.filter((v): v is Video => v !== null);
}

export async function getChannelDetails(channelId: string): Promise<ChannelDetails> {
    const youtube = await getYouTubeInstance();
    try {
        const channel = await youtube.getChannel(channelId);
        if (!channel) throw new Error(`ID ${channelId} のチャンネルが見つかりません。`);

        return {
            id: channel.id,
            name: channel.title || '不明なチャンネル',
            avatarUrl: channel.thumbnails?.find((t: any) => t.width > 150)?.url || channel.thumbnails?.[0]?.url || '',
            subscriberCount: channel.subscribers?.text || '非公開',
            bannerUrl: channel.banner?.url || '',
            description: channel.description?.text || '',
            handle: channel.custom_url || channel.title, // handleはcustom_urlかタイトルを使用
        };
    } catch (error) {
        console.error(`Failed to fetch channel details for ${channelId} using YouTubei.js:`, error);
        throw new Error('チャンネル詳細の取得に失敗しました。');
    }
}

export async function getChannelVideos(channelId: string, pageToken = ''): Promise<{ videos: Video[], nextPageToken?: string }> {
    const youtube = await getYouTubeInstance();
    try {
        let results;
        if (pageToken) {
            results = await youtube.getChannelContents(channelId, { type: 'videos', continuation: pageToken });
        } else {
            results = await youtube.getChannelContents(channelId, { type: 'videos' });
        }

        const videos: Video[] = (results.videos || [])
            .map(mapYouTubeiVideoToVideo)
            .filter((v): v is Video => v !== null);
        
        const nextPageToken = results.continuation?.token;
        return { videos, nextPageToken };
    } catch (error) {
        console.error(`Failed to fetch channel videos for ${channelId} using YouTubei.js:`, error);
        throw new Error('チャンネル動画の取得に失敗しました。');
    }
}

export async function getChannelPlaylists(channelId: string, pageToken = ''): Promise<{ playlists: ApiPlaylist[], nextPageToken?: string }> {
    const youtube = await getYouTubeInstance();
    try {
        let results;
        if (pageToken) {
            results = await youtube.getChannelContents(channelId, { type: 'playlists', continuation: pageToken });
        } else {
            results = await youtube.getChannelContents(channelId, { type: 'playlists' });
        }

        const playlists: ApiPlaylist[] = (results.playlists || []).map((item: any): ApiPlaylist => ({
            id: item.id,
            title: item.title,
            thumbnailUrl: item.thumbnails?.[0]?.url || (item.first_video?.id ? `https://i.ytimg.com/vi/${item.first_video.id}/hqdefault.jpg` : undefined),
            videoCount: item.video_count?.text ? parseInt(item.video_count.text.replace(/[^0-9]/g, ''), 10) : 0,
            author: item.author?.name || '不明',
            authorId: item.author?.id || '',
        }));

        const nextPageToken = results.continuation?.token;
        return { playlists, nextPageToken };
    } catch (error) {
        console.error(`Failed to fetch channel playlists for ${channelId} using YouTubei.js:`, error);
        throw new Error('チャンネルプレイリストの取得に失敗しました。');
    }
}

export async function getPlaylistDetails(playlistId: string): Promise<PlaylistDetails> {
    const youtube = await getYouTubeInstance();
    try {
        const playlist = await youtube.getPlaylist(playlistId);
        if (!playlist) throw new Error(`ID ${playlistId} のプレイリストが見つかりません。`);

        const videos = (playlist.videos || []).map(mapYouTubeiVideoToVideo).filter((v): v is Video => v !== null);

        return {
            title: playlist.title || '無題のプレイリスト',
            author: playlist.author?.name || '不明',
            authorId: playlist.author?.id || '',
            description: playlist.description?.text || '',
            videos: videos
        };
    } catch (error) {
        console.error(`Failed to fetch playlist details for ${playlistId} using YouTubei.js:`, error);
        throw new Error('プレイリスト詳細の取得に失敗しました。');
    }
}

// playerConfigはYouTubei.jsの管轄外なので、既存のものをそのまま残します
let playerConfigParams: string | null = null;
export async function getPlayerConfig(): Promise<string> {
    if (playerConfigParams) {
        return playerConfigParams;
    }

    try {
        // 注: このproxiedFetchは、YouTubei.jsとは直接関係なく、
        // 外部のJSONファイルをフェッチするためのものです。
        // /api/proxyが動作しない場合は、この部分も修正が必要です。
        const response = await fetch('/api/proxy?url=' + encodeURIComponent('https://raw.githubusercontent.com/siawaseok3/wakame/master/video_config.json'), { signal: AbortSignal.timeout(30000) });
        const config = await response.json();
        
        if (typeof config.params !== 'string') {
            throw new Error('Invalid player config format: "params" key is missing or not a string.');
        }

        const decodedParams = config.params.replace(/&amp;/g, '&');
        playerConfigParams = decodedParams;
        return playerConfigParams;
    } catch (error) {
        console.error("Error fetching or parsing player config, falling back to default params:", error);
        return '?autoplay=1&rel=0';
    }
}

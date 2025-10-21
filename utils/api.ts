import type { Video, VideoDetails, Channel, ChannelDetails, ApiPlaylist, Comment, PlaylistDetails } from '../types';

// (apiFetch, helpers, getPlayerConfig, mapYoutubeiVideoToVideo は変更なし)
const apiFetch = async (endpoint: string) => {
    const response = await fetch(`/api/${endpoint}`);
    const text = await response.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch (e) {
        console.error("Failed to parse JSON response from endpoint:", endpoint, "Response text:", text);
        throw new Error(`Server returned a non-JSON response for endpoint: ${endpoint}`);
    }
    if (!response.ok) {
        throw new Error(data.error || `Request failed for ${endpoint} with status ${response.status}`);
    }
    return data;
};
const formatNumber = (num: number): string => {
  if (isNaN(num)) return '0';
  if (num >= 100_000_000) return `${(num / 100_000_000).toFixed(1)}億`;
  if (num >= 10_000) return `${Math.floor(num / 10_000)}万`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}千`;
  return num.toLocaleString();
};
const formatDuration = (totalSeconds: number): string => {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "0:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};
export const formatTimeAgo = (dateString?: string): string => {
  if (!dateString) return '';
  return dateString;
};
let playerConfigParams: string | null = null;
export async function getPlayerConfig(): Promise<string> {
    if (playerConfigParams) return playerConfigParams;
    try {
        const response = await fetch('https://raw.githubusercontent.com/siawaseok3/wakame/master/video_config.json');
        const config = await response.json();
        const decodedParams = (config.params || '').replace(/&amp;/g, '&');
        playerConfigParams = decodedParams;
        return playerConfigParams;
    } catch (error) {
        console.error("Error fetching player config:", error);
        return '?autoplay=1&rel=0';
    }
}
const mapYoutubeiVideoToVideo = (item: any): Video | null => {
    if (!item?.id) return null;
    return {
        id: item.id,
        thumbnailUrl: item.thumbnails?.[0]?.url.split('?')[0] ?? `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
        duration: item.duration?.text ?? '',
        isoDuration: `PT${item.duration?.seconds ?? 0}S`,
        title: item.title?.text ?? item.title ?? '無題の動画',
        channelName: item.author?.name ?? item.channel?.name ?? '不明なチャンネル',
        channelId: item.author?.id ?? item.channel?.id ?? '',
        channelAvatarUrl: item.author?.thumbnails?.[0]?.url ?? item.channel?.thumbnails?.[0]?.url ?? '',
        views: item.view_count?.text ?? '視聴回数不明',
        uploadedAt: item.published?.text ?? '',
        descriptionSnippet: item.description_snippet?.text ?? '',
    };
};
//(getRecommendedVideos, searchVideos は変更なし)
export async function getRecommendedVideos(): Promise<{ videos: Video[] }> {
    const data = await apiFetch('fvideo');
    const videos = data.videos?.map(mapYoutubeiVideoToVideo).filter((v): v is Video => v !== null) ?? [];
    return { videos };
}
export async function searchVideos(query: string, pageToken = '', channelId?: string): Promise<{ videos: Video[], nextPageToken?: string }> {
    const data = await apiFetch(`search?q=${encodeURIComponent(query)}&limit=100`);
    let videos: Video[] = Array.isArray(data) ? data.map(mapYoutubeiVideoToVideo).filter((v): v is Video => v !== null) : [];
    if (channelId) {
        videos = videos.filter(v => v.channelId === channelId);
    }
    return { videos, nextPageToken: undefined };
}


// ★★★ ここからが最重要の修正点 ★★★

export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
    const data = await apiFetch(`video?id=${videoId}`);
    
    if (data.playability_status?.status !== 'OK' && !data.primary_info) {
        throw new Error(data.playability_status?.reason ?? 'この動画は利用できません。');
    }

    const primary = data.primary_info;
    const secondary = data.secondary_info;
    const basic = data.basic_info;

    const channel: Channel = {
        id: secondary?.owner?.author?.id ?? '',
        name: secondary?.owner?.author?.name ?? '不明なチャンネル',
        avatarUrl: secondary?.owner?.author?.thumbnails?.[0]?.url ?? '',
        subscriberCount: secondary?.owner?.subscriber_count?.text ?? '0',
    };

    const relatedVideos = (data.watch_next_feed || [])
        .map(mapYoutubeiVideoToVideo)
        .filter((v): v is Video => v !== null);

    return {
        id: videoId,
        thumbnailUrl: basic?.thumbnail?.[0]?.url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: formatDuration(basic?.duration ?? 0),
        isoDuration: `PT${basic?.duration ?? 0}S`,
        title: primary?.title?.text ?? '無題の動画',
        channelName: channel.name,
        channelId: channel.id,
        channelAvatarUrl: channel.avatarUrl,
        views: primary?.view_count?.text ?? '0回視聴',
        uploadedAt: primary?.relative_date?.text ?? '',
        description: secondary?.description?.text?.replace(/\n/g, '<br />') ?? '',
        likes: basic?.like_count?.toString() ?? '0', // 簡略化のため文字列として扱う
        dislikes: '0',
        channel: channel,
        relatedVideos: relatedVideos,
    };
}

export async function getComments(videoId: string): Promise<Comment[]> {
    const data = await apiFetch(`comments?id=${videoId}`);
    return (data.comments as Comment[]) ?? [];
}

export async function getVideosByIds(videoIds: string[]): Promise<Video[]> {
    if (videoIds.length === 0) return [];
    const promises = videoIds.map(id => getVideoDetails(id).catch(err => {
        console.error(`Failed to fetch video ${id}`, err);
        return null;
    }));
    const results = await Promise.all(promises);
    return results.filter((v): v is Video => v !== null);
}

export async function getChannelDetails(channelId: string): Promise<ChannelDetails> {
    const data = await apiFetch(`channel?id=${channelId}`);
    const channel = data.channel;
    
    if (!channel) throw new Error(`Channel with ID ${channelId} not found.`);
    
    return {
        id: channelId,
        name: channel.name ?? 'No Name',
        avatarUrl: channel.avatar?.[0]?.url,
        subscriberCount: channel.subscriberCount ?? '非公開',
        bannerUrl: channel.banner?.url,
        description: channel.description ?? '',
        // ★★★ 修正点: バックエンドから来た動画本数を正しく読み取る ★★★
        videoCount: channel.videoCount ?? 0,
        handle: channel.name,
    };
}

// (getChannelVideos, getChannelPlaylists, getPlaylistDetails は変更なし)
export async function getChannelVideos(channelId: string, pageToken = '1'): Promise<{ videos: Video[], nextPageToken?: string }> {
    const page = parseInt(pageToken, 10);
    const data = await apiFetch(`channel?id=${channelId}&page=${page}`);
    const videos = data.videos?.map(mapYoutubeiVideoToVideo).filter((v): v is Video => v !== null) ?? [];
    const hasMore = videos.length > 0;
    return { videos, nextPageToken: hasMore ? String(page + 1) : undefined };
}
export async function getChannelPlaylists(channelId: string): Promise<{ playlists: ApiPlaylist[] }> {
    const data = await apiFetch(`channel-playlists?id=${channelId}`);
    const playlists: ApiPlaylist[] = (data.playlists || []).map((item: any): ApiPlaylist => ({
        id: item.id,
        title: item.title,
        thumbnailUrl: item.thumbnails?.[0]?.url,
        videoCount: item.video_count ?? 0,
        author: item.author?.name,
        authorId: item.author?.id,
    }));
    return { playlists };
}
export async function getPlaylistDetails(playlistId: string): Promise<PlaylistDetails> {
    const data = await apiFetch(`playlist?id=${playlistId}`);
    if (!data.info?.id) throw new Error(`Playlist with ID ${playlistId} not found.`);
    const videos = (data.videos || []).map(mapYoutubeiVideoToVideo).filter((v): v is Video => v !== null);
    return {
        title: data.info.title,
        author: data.info.author?.name ?? '不明',
        authorId: data.info.author?.id ?? '',
        description: data.info.description ?? '',
        videos: videos
    };
}

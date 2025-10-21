import type { Video, VideoDetails, Channel, ChannelDetails, ApiPlaylist, Comment, PlaylistDetails } from '../types';

// --- API FETCHER FOR OUR VERCEL ENDPOINT ---
const youtubeiFetch = async (params: URLSearchParams) => {
    const url = `/api/youtube?${params.toString()}`;
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
        if (!response.ok) {
             const errorText = await response.text();
             let errorJson;
             try {
                errorJson = JSON.parse(errorText);
             } catch (e) {
                 throw new Error(errorText || `Request failed: ${response.status}`);
             }
             throw new Error(errorJson.error || `Request failed: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Fetch from ${url} failed.`, error);
        throw error;
    }
};

// --- HELPER FUNCTIONS ---
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

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export const formatTimeAgo = (unixTimestamp: number): string => {
  if (!unixTimestamp) return '';
  const date = new Date(unixTimestamp * 1000);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)}年前`;
  interval = seconds / 2592000;
  if (interval > 1) return `${Math.floor(interval)}ヶ月前`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)}日前`;
  interval = seconds / 3600;
  if (interval > 1) return `${Math.floor(interval)}時間前`;
  interval = seconds / 60;
  if (interval > 1) return `${Math.floor(interval)}分前`;
  return `${Math.floor(seconds)}秒前`;
};

// This function can remain as it is, separate from youtubei.js
export async function getPlayerConfig(): Promise<string> {
    try {
        const response = await fetch('https://raw.githubusercontent.com/siawaseok3/wakame/master/video_config.json');
        const config = await response.json();
        const decodedParams = (config.params as string).replace(/&amp;/g, '&');
        return decodedParams;
    } catch (error) {
        console.error("Error fetching or parsing player config, falling back to default params:", error);
        return '?autoplay=1&rel=0';
    }
}

// --- DATA MAPPING HELPERS ---
const mapYoutubeiVideoToVideo = (item: any): Video | null => {
    if (!item || !item.id) return null;
    const duration_seconds = item.duration?.seconds || 0;
    
    return {
        id: item.id,
        thumbnailUrl: item.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
        duration: item.duration?.text || formatDuration(duration_seconds),
        isoDuration: `PT${duration_seconds}S`,
        title: item.title?.text || '無題の動画',
        channelName: item.author?.name || '不明なチャンネル',
        channelId: item.author?.id || '',
        channelAvatarUrl: item.author?.thumbnails?.[0]?.url || '',
        views: item.view_count?.text || '視聴回数不明',
        uploadedAt: item.published?.text || '',
        descriptionSnippet: item.description_snippet?.text || '',
    };
};

// --- EXPORTED API FUNCTIONS ---

export async function getRecommendedVideos(): Promise<{videos: Video[]}> {
  const data = await youtubeiFetch(new URLSearchParams({ action: 'trending' }));
  if (!Array.isArray(data.videos)) throw new Error("Invalid data format from trending API.");
  const videos = data.videos.map(mapYoutubeiVideoToVideo).filter((v): v is Video => v !== null);
  return { videos };
}

export async function searchVideos(query: string, pageToken = '', channelId?: string): Promise<{videos: Video[], nextPageToken?: string}> {
  const params = new URLSearchParams({ action: 'search', q: query });
  if (pageToken) params.set('pageToken', pageToken);

  const data = await youtubeiFetch(params);
  if (!Array.isArray(data.videos)) throw new Error("Invalid data format from search API.");

  let videos: Video[] = data.videos.map(mapYoutubeiVideoToVideo).filter((v): v is Video => v !== null);
  if (channelId) videos = videos.filter(v => v.channelId === channelId);

  return { videos, nextPageToken: data.continuation };
}

export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
    const data = await youtubeiFetch(new URLSearchParams({ action: 'videoDetails', id: videoId }));
    const basic = data.basic_info;
    if (!basic) throw new Error(data.playability_status?.reason || '動画は利用できません。');

    const channel: Channel = {
        id: basic.channel.id,
        name: basic.channel.name,
        avatarUrl: basic.channel.thumbnails?.[0]?.url,
        subscriberCount: 'N/A', // getInfo doesn't provide this
        badges: [],
    };
    
    const relatedVideos: Video[] = (data.related_videos || []).map(mapYoutubeiVideoToVideo).filter((v): v is Video => v !== null);

    return {
        id: videoId,
        thumbnailUrl: basic.thumbnail?.slice(-1)[0]?.url,
        duration: formatDuration(basic.duration),
        isoDuration: `PT${basic.duration}S`,
        title: basic.title,
        channelName: channel.name,
        channelId: channel.id,
        channelAvatarUrl: channel.avatarUrl,
        views: `${basic.view_count.toLocaleString()}回視聴`,
        uploadedAt: 'N/A', // getInfo doesn't provide relative time
        description: data.description?.replace(/\n/g, '<br />') || '',
        likes: formatNumber(basic.like_count),
        dislikes: '0',
        channel: channel,
        relatedVideos: relatedVideos,
    };
}

export async function getComments(videoId: string): Promise<Comment[]> {
    const data = await youtubeiFetch(new URLSearchParams({ action: 'comments', id: videoId }));
    if (!Array.isArray(data.contents)) return [];
    
    return data.contents.map((c: any): Comment => ({
        comment_id: c.id,
        text: c.text.text,
        published_time: c.published,
        author: {
            id: c.author.id,
            name: c.author.name,
            thumbnails: c.author.thumbnails,
        },
        like_count: c.likes,
        reply_count: c.reply_count,
        is_pinned: c.is_pinned || false,
    }));
}

export async function getVideosByIds(videoIds: string[]): Promise<Video[]> {
    if (videoIds.length === 0) return [];
    const promises = videoIds.map(id => getVideoDetails(id).catch(err => {
        console.error(`Failed to fetch video ${id}`, err); return null;
    }));
    const results = await Promise.all(promises);
    return results.filter((v): v is Video => v !== null);
}

export async function getChannelDetails(channelId: string): Promise<ChannelDetails> {
    const data = await youtubeiFetch(new URLSearchParams({ action: 'channelDetails', id: channelId }));
    if (!data.header) throw new Error(`ID ${channelId} のチャンネルが見つかりません。`);

    return {
        id: channelId,
        name: data.header.author.name,
        avatarUrl: data.header.author.thumbnails?.slice(-1)[0]?.url,
        subscriberCount: data.header.subscriber_count?.text || '非公開',
        bannerUrl: data.header.banner?.slice(-1)[0]?.url,
        description: data.metadata?.description || '',
        videoCount: parseInt(data.header.videos_count?.text?.replace(/,/g, '') || '0', 10),
        handle: data.header.handle?.text,
    };
}

export async function getChannelVideos(channelId: string, pageToken = ''): Promise<{videos: Video[], nextPageToken?: string}> {
    const params = new URLSearchParams({ action: 'channelVideos', id: channelId });
    if(pageToken) params.set('pageToken', pageToken);

    const data = await youtubeiFetch(params);
    if (!Array.isArray(data.videos)) return { videos: [], nextPageToken: undefined };
    
    const videos: Video[] = data.videos.map(mapYoutubeiVideoToVideo).filter((v): v is Video => v !== null);
    
    return { videos, nextPageToken: data.continuation };
}

export async function getChannelPlaylists(channelId: string, pageToken = ''): Promise<{playlists: ApiPlaylist[], nextPageToken?: string}> {
    const params = new URLSearchParams({ action: 'channelPlaylists', id: channelId });
     if(pageToken) params.set('pageToken', pageToken);
    
    const data = await youtubeiFetch(params);
    if (!Array.isArray(data.playlists)) return { playlists: [], nextPageToken: undefined };
    
    const playlists: ApiPlaylist[] = data.playlists.map((item: any): ApiPlaylist => ({
        id: item.id,
        title: item.title,
        thumbnailUrl: item.thumbnails?.slice(-1)[0]?.url,
        videoCount: item.video_count,
        author: item.author?.name,
        authorId: item.author?.id,
    }));
    
    return { playlists, nextPageToken: data.continuation };
}

export async function getPlaylistDetails(playlistId: string): Promise<PlaylistDetails> {
    const data = await youtubeiFetch(new URLSearchParams({ action: 'playlistDetails', id: playlistId }));
    if (!data.id) throw new Error(`ID ${playlistId} のプレイリストが見つかりません。`);
    
    const videos = (data.videos || []).map(mapYoutubeiVideoToVideo).filter((v): v is Video => v !== null);
    
    return {
        title: data.info.title,
        author: data.info.author.name,
        authorId: data.info.author.id,
        description: data.info.description || '',
        videos: videos
    };
}

import type { Video, VideoDetails, Channel, ChannelDetails, ApiPlaylist, Comment, PlaylistDetails } from '../types';

// 複数の安定した公開APIインスタンスをバックエンドとして使用します
const INSTANCES = [
  'https://vid.puffyan.us',
  'https://invidious.kavin.rocks',
  'https://iv.ggtyler.dev',
  'https://invidious.nerdvpn.de',
  'https://invidious.lunar.icu',
  'https://inv.odyssey346.dev',
  'https://invidious.slipfox.xyz',
];

// --- PROXIED FETCHER ---
const proxiedFetch = async (targetUrl: string) => {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
    try {
        const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(30000) });
        let result;
        try {
            result = await response.json();
        } catch (e) {
             const text = await response.text();
             throw new Error(`Invalid JSON response from proxy. Status: ${response.status}. Body: ${text}`);
        }
        if (!response.ok) {
            throw new Error(result.error || `Request failed: ${response.status}`);
        }
        return result;
    } catch (error) {
        throw error;
    }
};

// --- CENTRALIZED API FETCHER WITH FALLBACKS (for non-xeroxapp endpoints) ---
const apiFetch = async (endpoint: string) => {
  const shuffledInstances = [...INSTANCES].sort(() => Math.random() - 0.5);
  for (const instanceUrl of shuffledInstances) {
    const fullUrl = `${instanceUrl}/api/v1${endpoint}`;
    try {
      return await proxiedFetch(fullUrl);
    } catch (error) {
      console.error(`Fetch from ${instanceUrl} via proxy failed. Retrying with next instance.`, error);
    }
  }
  throw new Error('すべてのAPIサーバーにアクセスできませんでした。時間をおいて再度お試しください。');
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

// --- PLAYER CONFIG FETCHER ---
let playerConfigParams: string | null = null;

export async function getPlayerConfig(): Promise<string> {
    if (playerConfigParams) {
        return playerConfigParams;
    }

    try {
        const config = await proxiedFetch('https://raw.githubusercontent.com/siawaseok3/wakame/master/video_config.json');
        
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


// --- DATA MAPPING HELPERS ---
const mapInvidiousItemToVideo = (item: any): Video | null => {
    if (!item.videoId) return null;
    return {
        id: item.videoId, thumbnailUrl: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
        duration: formatDuration(item.lengthSeconds), isoDuration: `PT${item.lengthSeconds}S`, title: item.title,
        channelName: item.author, channelId: item.authorId, channelAvatarUrl: '',
        views: `${formatNumber(item.viewCount)}回視聴`, uploadedAt: item.publishedText || formatTimeAgo(item.published),
    };
};

const mapXeroxSearchResultToVideo = (item: any): Video | null => {
    if (item?.type !== 'Video' || !item.id) return null;
    const durationInSeconds = item.duration?.seconds ?? 0;
    return {
        id: item.id, thumbnailUrl: `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
        duration: item.duration?.text || '', isoDuration: `PT${durationInSeconds}S`,
        title: item.title?.text || '無題の動画', channelName: item.author?.name || '不明なチャンネル',
        channelId: item.author?.id || '', channelAvatarUrl: item.author?.thumbnails?.[0]?.url || '',
        views: item.view_count?.text || '視聴回数不明', uploadedAt: item.published?.text || '',
        descriptionSnippet: item.description_snippet?.text || '',
    };
};


// --- EXPORTED API FUNCTIONS ---

export async function getNewChannelPageData(channelId: string): Promise<{ details: ChannelDetails, videos: Video[] }> {
    const data = await proxiedFetch(`https://siawaseok.duckdns.org/api/channel/${channelId}`);
    if (!data.channelId) throw new Error(`ID ${channelId} のチャンネルが見つかりません。`);

    const details: ChannelDetails = {
        id: data.channelId,
        name: data.title,
        avatarUrl: data.avatar,
        subscriberCount: data.videoCount, // This key from the new API contains subscriber count text
        bannerUrl: data.banner || undefined,
        description: data.description,
        videoCount: 0, // Total video count is not available in the new API
        handle: data.title, // Handle is not available, using title as a fallback
    };

    const videos: Video[] = data.playlists?.[0]?.items?.map((v: any): Video => ({
        id: v.videoId,
        thumbnailUrl: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        duration: v.duration,
        isoDuration: '', // Not available in new API
        title: v.title,
        channelName: data.title,
        channelId: data.channelId,
        channelAvatarUrl: data.avatar,
        views: v.viewCount,
        uploadedAt: v.published,
    })) || [];

    return { details, videos };
}

export async function getRecommendedVideos(): Promise<{videos: Video[]}> {
  const data = await apiFetch('/trending');
  if (!Array.isArray(data)) throw new Error("Invalid data format from trending API.");
  const videos = data.map(mapInvidiousItemToVideo).filter((v): v is Video => v !== null);
  return { videos };
}

export async function searchVideos(query: string, pageToken = '', channelId?: string): Promise<{videos: Video[], nextPageToken?: string}> {
  const url = `https://xeroxapp060.vercel.app/api/search?q=${encodeURIComponent(query)}&limit=100`;
  try {
    const data = await proxiedFetch(url);
    if (!Array.isArray(data)) throw new Error("Invalid data format from search API.");
    let videos: Video[] = data.map(mapXeroxSearchResultToVideo).filter((v): v is Video => v !== null);
    if (channelId) videos = videos.filter(v => v.channelId === channelId);
    return { videos, nextPageToken: undefined };
  } catch (error) {
    console.error(`Failed to fetch search results for query: ${query}`, error);
    throw new Error('検索結果の取得に失敗しました。');
  }
}

export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
    try {
        const data = await proxiedFetch(`https://xeroxapp060.vercel.app/api/video?id=${videoId}`);
        
        if (data.playability_status?.status !== 'OK' && !data.primary_info?.title?.text) {
             throw new Error(data.playability_status?.reason || '動画は利用できません。');
        }

        const primary = data.primary_info;
        const secondary = data.secondary_info;
        const basic = data.basic_info;

        const channel: Channel = {
            id: secondary.owner.author.id,
            name: secondary.owner.author.name,
            avatarUrl: secondary.owner.author.thumbnails.find((t: any) => t.width >= 88)?.url || secondary.owner.author.thumbnails[0]?.url,
            subscriberCount: secondary.owner.subscriber_count.text,
            badges: secondary.owner.author.badges?.map((b: any) => ({ type: b.style, tooltip: b.tooltip })) || [],
        };
        
        const relatedVideos: Video[] = (data.watch_next_feed || [])
            .map((item: any): Video | null => {
                if (item?.type !== 'LockupView' || item.content_type !== 'VIDEO' || !item.content_id) return null;
                
                const metadata = item.metadata?.metadata;
                const rows = metadata?.metadata_rows || [];
                const authorInfo = rows[0]?.metadata_parts[0]?.text;
                const viewInfo = rows[1]?.metadata_parts;

                const endScreenItem = data.player_overlays?.end_screen?.results.find((res: any) => res.type === 'EndScreenVideo' && res.id === item.content_id);
                const duration = endScreenItem?.duration?.text || '';

                return {
                    id: item.content_id,
                    thumbnailUrl: `https://i.ytimg.com/vi/${item.content_id}/hqdefault.jpg`,
                    duration: duration,
                    isoDuration: '', // Not available
                    title: item.metadata?.title?.text || 'Untitled Video',
                    channelName: authorInfo?.text || 'Unknown Channel',
                    channelId: authorInfo?.endpoint?.payload?.browseId || '',
                    channelAvatarUrl: '', // Not available in this part of feed
                    views: viewInfo?.[0]?.text?.text || '',
                    uploadedAt: viewInfo?.[1]?.text?.text || '',
                };
            })
            .filter((v): v is Video => v !== null);

        return {
            id: videoId,
            thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            duration: '', // Not available in this API response
            isoDuration: '', // Not available
            title: primary.title.text,
            channelName: channel.name,
            channelId: channel.id,
            channelAvatarUrl: channel.avatarUrl,
            views: primary.view_count.text,
            uploadedAt: primary.relative_date.text,
            description: secondary.description.text.replace(/\n/g, '<br />'),
            likes: formatNumber(basic.like_count),
            dislikes: '0', // Not available in payload
            channel: channel,
            relatedVideos: relatedVideos,
        };
    } catch (error: any) {
        console.error(`Failed to fetch video details for ${videoId}:`, error);
        throw new Error(error.message || '動画詳細の取得に失敗しました。');
    }
}

export async function getComments(videoId: string): Promise<Comment[]> {
    try {
        const data = await proxiedFetch(`https://xeroxapp060.vercel.app/api/comments?id=${videoId}`);
        if (!data.comments || !Array.isArray(data.comments)) {
            return [];
        }
        return data.comments;
    } catch (error) {
        console.error(`Failed to fetch comments for video ${videoId}:`, error);
        return [];
    }
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
    const data = await apiFetch(`/channels/${channelId}`);
    if (!data.authorId) throw new Error(`ID ${channelId} のチャンネルが見つかりません。`);
    return {
        id: data.authorId, name: data.author,
        avatarUrl: data.authorThumbnails?.find((t:any) => t.width > 150)?.url || data.authorThumbnails?.[0]?.url,
        subscriberCount: formatNumber(data.subCount),
        bannerUrl: data.authorBanners?.find((b: any) => b.width > 1000)?.url,
        description: data.description, videoCount: data.videoCount, handle: data.author,
    };
}

export async function getChannelVideos(channelId: string, pageToken = '1'): Promise<{videos: Video[], nextPageToken?: string}> {
    const page = parseInt(pageToken, 10);
    const data = await apiFetch(`/channels/${channelId}/videos?page=${page}`);
    const videos: Video[] = (data.videos || []).map(mapInvidiousItemToVideo).filter((v): v is Video => v !== null);
    const hasMore = videos.length > 0;
    return { videos, nextPageToken: hasMore ? String(page + 1) : undefined };
}

export async function getChannelPlaylists(channelId: string, pageToken = '1'): Promise<{playlists: ApiPlaylist[], nextPageToken?: string}> {
    const page = parseInt(pageToken, 10);
    const data = await apiFetch(`/channels/${channelId}/playlists?page=${page}`);
    const playlists: ApiPlaylist[] = (data.playlists || []).map((item: any): ApiPlaylist => ({
        id: item.playlistId,
        title: item.title,
        thumbnailUrl: item.videos?.[0]?.videoId ? `https://i.ytimg.com/vi/${item.videos[0].videoId}/hqdefault.jpg` : undefined,
        videoCount: item.videoCount,
        author: item.author,
        authorId: item.authorId,
    }));
    const hasMore = playlists.length > 0;
    return { playlists, nextPageToken: hasMore ? String(page + 1) : undefined };
}

export async function getPlaylistDetails(playlistId: string): Promise<PlaylistDetails> {
    const data = await apiFetch(`/playlists/${playlistId}`);
    if (!data.playlistId) throw new Error(`ID ${playlistId} のプレイリストが見つかりません。`);
    
    const videos = (data.videos || []).map(mapInvidiousItemToVideo).filter((v): v is Video => v !== null);
    
    return {
        title: data.title,
        author: data.author,
        authorId: data.authorId,
        description: data.description,
        videos: videos
    };
}

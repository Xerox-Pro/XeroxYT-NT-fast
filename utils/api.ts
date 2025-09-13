
import type { Video, VideoDetails, Channel, ChannelDetails, ApiPlaylist, ChannelBadge } from '../types';

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

// --- DATA MAPPING HELPERS ---
const mapFVideoItemToVideo = (item: any): Video | null => {
    if (!item.id || !item.title?.text) return null;
    return {
        id: item.id,
        thumbnailUrl: `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
        duration: '', isoDuration: '', title: item.title.text,
        channelName: item.channel, channelId: '', channelAvatarUrl: '',
        views: item.views?.text || '視聴回数不明', uploadedAt: item.uploaded?.text || '',
    };
};

const mapInvidiousItemToVideo = (item: any): Video | null => {
    if (!item.videoId) return null;
    return {
        id: item.videoId, thumbnailUrl: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
        duration: formatDuration(item.lengthSeconds), isoDuration: `PT${item.lengthSeconds}S`, title: item.title,
        channelName: item.author, channelId: item.authorId, channelAvatarUrl: '',
        views: `${formatNumber(item.viewCount)}回視聴`, uploadedAt: item.publishedText || formatTimeAgo(item.published),
    };
};

const mapInvidiousDetailsToVideo = (item: any): Video => ({
    id: item.videoId, thumbnailUrl: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
    duration: formatDuration(item.lengthSeconds), isoDuration: `PT${item.lengthSeconds}S`, title: item.title,
    channelName: item.author, channelId: item.authorId,
    channelAvatarUrl: item.authorThumbnails?.[0]?.url || '',
    views: `${formatNumber(item.viewCount)}回視聴`, uploadedAt: item.publishedText || formatTimeAgo(item.published),
});

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

export async function getRecommendedVideos(): Promise<{videos: Video[]}> {
  const url = `https://xeroxapp060.vercel.app/api/fvideo`;
  const data = await proxiedFetch(url);
  if (!data?.videos || !Array.isArray(data.videos)) throw new Error("Invalid data format from fvideo API.");
  const videos = data.videos.map(mapFVideoItemToVideo).filter((v): v is Video => v !== null);
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
    const url = `https://siawaseok.duckdns.org/api/video/${videoId}`;
    try {
        const data = await proxiedFetch(url);

        if (!data || !data.videoId) {
            if (data && data.error) {
                throw new Error(data.error);
            }
            throw new Error('APIからの動画詳細の解析に失敗しました。データが不完全です。');
        }
    
        const channel: Channel = {
            id: data.authorId || '',
            name: data.author || '不明なチャンネル',
            avatarUrl: data.authorThumbnails?.find((t: any) => t.width > 80)?.url || data.authorThumbnails?.[0]?.url || '',
            subscriberCount: data.subCountText || '',
            badges: [],
        };
    
        const relatedVideos: Video[] = (data.recommendedVideos || []).map((item: any): Video | null => {
            if (!item.videoId) return null;
            return {
                id: item.videoId,
                thumbnailUrl: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
                duration: formatDuration(item.lengthSeconds),
                isoDuration: `PT${item.lengthSeconds}S`,
                title: item.title,
                channelName: item.author,
                channelId: item.authorId || '',
                channelAvatarUrl: '',
                views: item.viewCountText || (item.viewCount ? `${formatNumber(item.viewCount)}回視聴` : ''),
                uploadedAt: item.publishedText || '',
            };
        }).filter((v): v is Video => v !== null);
    
        const descriptionHtml = data.descriptionHtml;
        const descriptionText = data.description || '';
    
        return {
            id: videoId,
            thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            duration: formatDuration(data.lengthSeconds),
            isoDuration: `PT${data.lengthSeconds}S`,
            title: data.title || '無題の動画',
            channelName: channel.name,
            channelId: channel.id,
            channelAvatarUrl: channel.avatarUrl,
            views: data.viewCountText || (data.viewCount ? `${formatNumber(data.viewCount)}回視聴` : '視聴回数不明'),
            uploadedAt: data.publishedText || (data.published ? formatTimeAgo(data.published) : ''),
            description: descriptionHtml ? descriptionHtml : descriptionText.replace(/\n/g, '<br />'),
            likes: formatNumber(data.likeCount || 0),
            dislikes: '0',
            channel: channel,
            relatedVideos: relatedVideos,
        };
    } catch (error: any) {
        console.error(`Failed to fetch video details for ${videoId}:`, error);
        throw new Error(error.message || '動画詳細の取得に失敗しました。');
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
        id: item.playlistId, title: item.title,
        thumbnailUrl: item.videos?.[0]?.videoId ? `https://i.ytimg.com/vi/${item.videos[0].videoId}/hqdefault.jpg` : undefined,
        videoCount: item.videoCount,
    }));
    const hasMore = playlists.length > 0;
    return { playlists, nextPageToken: hasMore ? String(page + 1) : undefined };
}

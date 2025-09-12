
import type { Video, VideoDetails, Channel, Comment, ChannelDetails, ApiPlaylist } from '../types';

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
        const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
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

// --- NEW EMBED KEY FETCHER ---
let embedKeyCache: string | null = null;
export const getEmbedKey = async (): Promise<string> => {
    if (embedKeyCache) {
        return embedKeyCache;
    }
    try {
        const configUrl = 'https://raw.githubusercontent.com/siawaseok3/wakame/master/video_config.json';
        const data = await proxiedFetch(configUrl);
        if (typeof data.params === 'string') {
            embedKeyCache = data.params;
            return embedKeyCache;
        }
        throw new Error('Invalid video_config.json format');
    } catch (error) {
        console.error("Failed to fetch embed key:", error);
        throw new Error('動画プレーヤーの設定の読み込みに失敗しました。');
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

const parseDescriptionRuns = (runs: any[]): string => {
    if (!runs || !Array.isArray(runs)) return '';
    return runs.map(run => {
        if (run.endpoint) {
            let url = '#';
            const payload = run.endpoint.payload;
            if (payload?.url) {
                const rawUrl = payload.url;
                if (rawUrl.startsWith('/redirect?')) {
                    const urlParams = new URLSearchParams(rawUrl.split('?')[1]);
                    url = urlParams.get('q') || rawUrl;
                } else {
                    url = `https://www.youtube.com${rawUrl}`;
                }
            } else if (payload?.browseId) {
                url = `/channel/${payload.browseId}`;
            }
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-yt-blue hover:underline">${run.text}</a>`;
        }
        return run.text ? run.text.replace(/\n/g, '<br />') : '';
    }).join('');
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
    const url = `https://xeroxapp60.vercel.app/api/video?id=${videoId}`;
    const data = await proxiedFetch(url);

    if (data.playability_status?.status === 'LOGIN_REQUIRED') {
        throw new Error(data.playability_status.reason || 'この動画は利用できません。');
    }
    
    if (!data.primary_info || !data.secondary_info) {
        throw new Error('APIからの動画詳細の解析に失敗しました。');
    }

    const primary = data.primary_info;
    const secondary = data.secondary_info;
    const owner = secondary.owner?.author;

    const channel: Channel = {
        id: owner?.id || '', name: owner?.name || '不明なチャンネル',
        avatarUrl: owner?.thumbnails?.find((t: any) => t.width > 80)?.url || owner?.thumbnails?.[0]?.url || '',
        subscriberCount: secondary.owner?.subscriber_count?.text || '',
    };

    const relatedVideos: Video[] = (data.watch_next_feed || [])
        .map((item: any): Video | null => {
            if (item.type !== 'LockupView' || !item.content_id) return null;
            const metadata = item.metadata?.metadata;
            const endScreenData = data.player_overlays?.end_screen?.results?.find((r:any) => r.id === item.content_id);
            return {
                id: item.content_id, thumbnailUrl: `https://i.ytimg.com/vi/${item.content_id}/hqdefault.jpg`,
                duration: endScreenData?.duration?.text || '', isoDuration: endScreenData?.duration?.seconds ? `PT${endScreenData.duration.seconds}S` : '',
                title: item.metadata?.title?.text || '',
                channelName: metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text?.text || '',
                channelId: '', views: metadata?.metadata_rows?.[1]?.metadata_parts?.[0]?.text?.text || '',
                channelAvatarUrl: '', uploadedAt: metadata?.metadata_rows?.[1]?.metadata_parts?.[1]?.text?.text || '',
            };
        }).filter((v): v is Video => v !== null);
    
    // The main video's duration is not in the main object, find it in the player overlays if possible.
    const endScreenSelf = data.player_overlays?.end_screen?.results?.find((r:any) => r.id === videoId);
    const mainVideoDuration = endScreenSelf?.duration?.text || '';
    const mainVideoIsoDuration = endScreenSelf?.duration?.seconds ? `PT${endScreenSelf.duration.seconds}S` : '';

    return {
        id: videoId, thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: mainVideoDuration, isoDuration: mainVideoIsoDuration,
        title: primary.title.text, channelName: channel.name, channelId: channel.id,
        channelAvatarUrl: channel.avatarUrl, views: primary.view_count.text,
        uploadedAt: primary.relative_date.text, description: parseDescriptionRuns(secondary.description.runs),
        likes: formatNumber(data.basic_info.like_count), dislikes: '0',
        channel: channel, relatedVideos: relatedVideos, comments: [] // Comments are not available
    };
}

export async function getVideosByIds(videoIds: string[]): Promise<Video[]> {
    if (videoIds.length === 0) return [];
    const promises = videoIds.map(id => apiFetch(`/videos/${id}`).then(mapInvidiousDetailsToVideo).catch(err => {
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
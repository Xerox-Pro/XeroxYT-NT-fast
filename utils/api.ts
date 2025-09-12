
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
// The user's example app uses a proxy to avoid CORS/network issues.
// This function replicates that pattern for all API calls.
const proxiedFetch = async (targetUrl: string) => {
    // We assume a proxy is available at /api/proxy as in the example.
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;

    try {
        // Use AbortSignal.timeout for a cleaner timeout implementation
        const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });

        let result;
        try {
            result = await response.json();
        } catch (e) {
             const text = await response.text();
             throw new Error(`Invalid JSON response from proxy. Status: ${response.status}. Body: ${text}`);
        }
        
        if (!response.ok) {
            // Use error message from proxied response if available
            throw new Error(result.error || `Request failed: ${response.status}`);
        }
        
        return result;
    } catch (error) {
        // Re-throw the error to be handled by the calling function.
        // This allows for retry logic in apiFetch.
        throw error;
    }
};


// --- CENTRALIZED API FETCHER WITH FALLBACKS ---
// API取得ロジックをプロキシ経由に変更
const apiFetch = async (endpoint: string) => {
  // 毎回リストをシャッフルして、特定のエンドポイントへの負荷を分散させます
  const shuffledInstances = [...INSTANCES].sort(() => Math.random() - 0.5);

  for (const instanceUrl of shuffledInstances) {
    const fullUrl = `${instanceUrl}/api/v1${endpoint}`;
    
    try {
      // Use the new proxied fetch function
      return await proxiedFetch(fullUrl);
    } catch (error) {
      console.error(`Fetch from ${instanceUrl} via proxy failed. Retrying with next instance.`, error);
      // ループは自動的に次のインスタンスで続行します
    }
  }
  // すべてのインスタンスが失敗した場合
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
        duration: '', // Not available in this API
        isoDuration: '', // Not available in this API
        title: item.title.text,
        channelName: item.channel,
        channelId: '', // Not available in this API
        channelAvatarUrl: '', // Not available in this API
        views: item.views?.text || '視聴回数不明',
        uploadedAt: item.uploaded?.text || '',
    };
};

const mapRelatedVideoItem = (item: any): Video | null => {
    if (item.content_type !== 'VIDEO' || !item.content_id) return null;
    
    const metadata = item.metadata?.metadata;
    const channelName = metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text?.text;
    const views = metadata?.metadata_rows?.[1]?.metadata_parts?.[0]?.text?.text;
    const uploaded = metadata?.metadata_rows?.[1]?.metadata_parts?.[1]?.text?.text;

    return {
        id: item.content_id,
        thumbnailUrl: `https://i.ytimg.com/vi/${item.content_id}/hqdefault.jpg`,
        duration: '', // Duration is not available for related videos in this API response
        isoDuration: '',
        title: item.metadata?.title?.text || '無題の動画',
        channelName: channelName || '不明なチャンネル',
        channelId: '', // Not available
        channelAvatarUrl: '', // Not available
        views: views || '視聴回数不明',
        uploadedAt: uploaded || ''
    };
};

const parseDescriptionRuns = (runs: any[]): string => {
    if (!Array.isArray(runs)) return '';
    return runs.map(run => {
        if (run.endpoint?.type === 'NavigationEndpoint' && run.endpoint.payload) {
            let url = run.endpoint.payload.url;
            if (!url) {
                if (run.endpoint.payload.browseId) {
                    url = `/channel/${run.endpoint.payload.browseId}`;
                } else {
                    url = '#';
                }
            }
            const target = url.startsWith('http') ? '_blank' : '';
            return `<a href="${url}" ${target ? `target="${target}" rel="noopener noreferrer"` : ''} class="text-yt-blue hover:underline">${run.text}</a>`;
        }
        return run.text.replace(/\n/g, '<br />');
    }).join('');
};

const mapInvidiousItemToVideo = (item: any): Video | null => {
    // The '/channels/:id/videos' endpoint items lack a 'type' field, so we only check for videoId.
    if (!item.videoId) return null;
    
    return {
        id: item.videoId,
        thumbnailUrl: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
        duration: formatDuration(item.lengthSeconds),
        isoDuration: `PT${item.lengthSeconds}S`, // ショート動画判定のためにISO形式を再構築
        title: item.title,
        channelName: item.author,
        channelId: item.authorId,
        channelAvatarUrl: '', // 検索結果には含まれないため、別途取得が必要
        views: `${formatNumber(item.viewCount)}回視聴`,
        uploadedAt: item.publishedText || formatTimeAgo(item.published),
    };
};

const mapInvidiousDetailsToVideo = (item: any): Video => {
    return {
        id: item.videoId,
        thumbnailUrl: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
        duration: formatDuration(item.lengthSeconds),
        isoDuration: `PT${item.lengthSeconds}S`,
        title: item.title,
        channelName: item.author,
        channelId: item.authorId,
        channelAvatarUrl: item.authorThumbnails?.[0]?.url || '',
        views: `${formatNumber(item.viewCount)}回視聴`,
        uploadedAt: item.publishedText || formatTimeAgo(item.published),
    }
}

const mapXeroxSearchResultToVideo = (item: any): Video | null => {
    if (item?.type !== 'Video' || !item.id) {
        return null;
    }

    const durationInSeconds = item.duration?.seconds ?? 0;

    return {
        id: item.id,
        thumbnailUrl: `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
        duration: item.duration?.text || '0:00',
        isoDuration: `PT${durationInSeconds}S`,
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
  const url = `https://xeroxapp060.vercel.app/api/fvideo`;
  const data = await proxiedFetch(url);
  
  if (!data?.videos || !Array.isArray(data.videos)) {
      throw new Error("Invalid data format from fvideo API.");
  }
  
  const videos = data.videos
      .map(mapFVideoItemToVideo)
      .filter((v): v is Video => v !== null)
      .slice(0, 10); // Take only 10 as requested
      
  return { videos };
}

export async function searchVideos(query: string, pageToken = '', channelId?: string): Promise<{videos: Video[], nextPageToken?: string}> {
  const url = `https://xeroxapp060.vercel.app/api/search?q=${encodeURIComponent(query)}&limit=100`;
  
  try {
    const data = await proxiedFetch(url);

    if (!Array.isArray(data)) {
      console.error("Unexpected API response:", data);
      throw new Error("Invalid data format from search API. Expected an array.");
    }

    let videos: Video[] = data
        .map(mapXeroxSearchResultToVideo)
        .filter((v): v is Video => v !== null);
    
    if (channelId) {
        videos = videos.filter(v => v.channelId === channelId);
    }
    
    return { videos, nextPageToken: undefined };
  } catch (error) {
      console.error(`Failed to fetch search results for query: ${query}`, error);
      throw new Error('検索結果の取得に失敗しました。時間をおいて再度お試しください。');
  }
}

export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
  const url = `https://xeroxapp60.vercel.app/api/video?id=${videoId}`;
  const videoData = await proxiedFetch(url);

  const commentsData = await apiFetch(`/comments/${videoId}`).catch(() => ({ comments: [] }));

  if (videoData.playability_status?.status === 'LOGIN_REQUIRED') {
      throw new Error(videoData.playability_status.reason || "This video is unavailable.");
  }

  const owner = videoData.secondary_info?.owner?.author;
  const channel: Channel = {
    id: owner?.id || '',
    name: owner?.name || 'Unknown Channel',
    avatarUrl: owner?.thumbnails?.[0]?.url || '',
    subscriberCount: videoData.secondary_info?.owner?.subscriber_count?.text || '0 subscribers',
  };
  
  const relatedVideos: Video[] = (videoData.watch_next_feed || [])
    .map(mapRelatedVideoItem)
    .filter((v): v is Video => v !== null);

  const comments: Comment[] = (commentsData.comments || []).map((item: any): Comment => ({
    id: item.commentId,
    author: item.author,
    authorAvatarUrl: item.authorThumbnails?.[0]?.url,
    text: item.contentHtml,
    likes: formatNumber(item.likeCount),
    publishedAt: item.publishedText,
  }));

  return {
    id: videoId,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: '', // Not available
    isoDuration: '',
    title: videoData.primary_info?.title?.text || 'Untitled Video',
    channelName: channel.name,
    channelId: channel.id,
    channelAvatarUrl: channel.avatarUrl,
    views: videoData.primary_info?.view_count?.text || '0 views',
    uploadedAt: videoData.primary_info?.relative_date?.text || '',
    description: parseDescriptionRuns(videoData.secondary_info?.description?.runs || []),
    likes: formatNumber(videoData.basic_info?.like_count || 0),
    dislikes: '0', // Not available
    channel: channel,
    relatedVideos: relatedVideos,
    comments: comments
  };
}

export async function getVideosByIds(videoIds: string[]): Promise<Video[]> {
    if (videoIds.length === 0) return [];
    
    const promises = videoIds.map(id => 
        apiFetch(`/videos/${id}`)
            .then(mapInvidiousDetailsToVideo)
            .catch(err => {
                console.error(`Failed to fetch video ${id}`, err);
                return null;
            })
    );
    const results = await Promise.all(promises);
    return results.filter((v): v is Video => v !== null);
}

export async function getChannelDetails(channelId: string): Promise<ChannelDetails> {
    const data = await apiFetch(`/channels/${channelId}`);
    if (!data.authorId) throw new Error(`ID ${channelId} のチャンネルが見つかりません。`);
    
    return {
        id: data.authorId,
        name: data.author,
        avatarUrl: data.authorThumbnails?.find((t:any) => t.width > 150)?.url || data.authorThumbnails?.[0]?.url,
        subscriberCount: formatNumber(data.subCount),
        bannerUrl: data.authorBanners?.find((b: any) => b.width > 1000)?.url,
        description: data.description,
        videoCount: data.videoCount,
        handle: data.author,
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

    const playlists: ApiPlaylist[] = (data.playlists || []).map((item: any): ApiPlaylist => {
        const firstVideoId = item.videos?.[0]?.videoId;
        return {
            id: item.playlistId,
            title: item.title,
            thumbnailUrl: firstVideoId ? `https://i.ytimg.com/vi/${firstVideoId}/hqdefault.jpg` : undefined,
            videoCount: item.videoCount,
        };
    });
    
    const hasMore = playlists.length > 0;
    return { playlists, nextPageToken: hasMore ? String(page + 1) : undefined };
}

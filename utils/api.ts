
import type { Video, VideoDetails, Channel, Comment, ChannelDetails, ApiPlaylist } from '../types';

const PROXY_API_BASE_URL = 'https://xeroxapp060.vercel.app/api';

// --- HELPER FUNCTIONS ---

const formatNumber = (numStr: string | number): string => {
  const num = Number(String(numStr).replace(/,/g, ''));
  if (isNaN(num)) return String(numStr);
  if (num >= 100_000_000) return `${(num / 100_000_000).toFixed(1)}億`;
  if (num >= 10_000) return `${Math.floor(num / 10_000)}万`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}千`;
  return num.toLocaleString();
};

const formatDuration = (duration: string): string => {
  if (!duration) return "0:00";
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return "0:00";
  
  match.shift(); // remove full match
  
  const [hours, minutes, seconds] = match.map(val => (val ? parseInt(val.slice(0, -1), 10) : 0));

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatTimeAgo = (dateStr: string): string => {
  if (!dateStr) return '';
  if (!dateStr.endsWith('Z')) { // Handle relative time strings from unofficial API
      return dateStr;
  }
  const date = new Date(dateStr);
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

// --- CENTRALIZED PROXY API FETCHER ---

const proxyApiFetch = async (endpoint: string) => {
  const response = await fetch(`${PROXY_API_BASE_URL}${endpoint}`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'サーバーにアクセスできませんでした。');
  }
  return response.json();
};


// --- DATA MAPPING HELPER ---

const mapProxyItemToVideo = (item: any): Video | null => {
    if (item.type !== 'video' && item.type !== 'Video' || !item.id) return null;
    return {
        id: item.id,
        thumbnailUrl: item.thumbnails?.find((t: any) => t.width >= 360)?.url || item.thumbnails?.[0]?.url,
        duration: item.duration?.text || '',
        isoDuration: item.isoDuration || '', // Assuming proxy might provide this
        title: item.title?.text || item.title || 'No title',
        channelName: item.author?.name || 'Unknown Channel',
        channelId: item.author?.id,
        channelAvatarUrl: item.author?.thumbnails?.[0]?.url || '',
        views: item.short_view_count?.text || item.view_count?.text || '視聴回数不明',
        uploadedAt: item.published?.text || '',
    };
};

// --- EXPORTED API FUNCTIONS ---

export async function getRecommendedVideos(): Promise<{videos: Video[], nextPageToken?: string}> {
  try {
    const data = await proxyApiFetch('/trending');
    if (!Array.isArray(data)) throw new Error("Invalid data format from trending API.");
    const videos = data.map(mapProxyItemToVideo).filter((v): v is Video => v !== null);
    return { videos, nextPageToken: undefined };
  } catch(err) {
    console.warn("Trending API failed, falling back to search", err);
    return searchVideos("人気の音楽");
  }
}

export async function searchVideos(query: string, pageToken = '', channelId?: string): Promise<{videos: Video[], nextPageToken?: string}> {
  const url = `/search?q=${encodeURIComponent(query)}&limit=20${channelId ? `&channelId=${channelId}` : ''}`;
  try {
    const data = await proxyApiFetch(url);
    if (!Array.isArray(data)) {
        console.error("Unexpected API response:", data);
        throw new Error("Invalid data format from search API.");
    }
    const videos = data.map(mapProxyItemToVideo).filter((v): v is Video => v !== null);
    return { videos, nextPageToken: undefined };
  } catch (err) {
    console.error('External API search error:', err);
    throw new Error('サーバーにアクセスできませんでした。');
  }
}

export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
  const data = await proxyApiFetch(`/details?id=${videoId}`);

  const channel: Channel = {
    id: data.author.id,
    name: data.author.name,
    avatarUrl: data.author.thumbnails?.[0]?.url,
    subscriberCount: `チャンネル登録者数 ${data.author.subscriber_count?.text || ''}`,
  };
  
  const relatedVideos: Video[] = (data.related_videos || []).map(mapProxyItemToVideo).filter((v): v is Video => v !== null);

  const comments: Comment[] = (data.comments || []).map((item: any): Comment => ({
    id: item.id,
    author: item.author.name,
    authorAvatarUrl: item.author.thumbnails?.[0]?.url,
    text: item.text,
    likes: formatNumber(item.like_count?.text || '0'),
    publishedAt: item.published.text,
  }));

  return {
    id: data.id,
    channelId: data.author.id,
    thumbnailUrl: data.thumbnails?.find((t: any) => t.width > 1000)?.url || data.thumbnails?.[0]?.url,
    duration: data.duration?.text || '',
    isoDuration: data.isoDuration || '',
    title: data.title,
    channelName: data.author.name,
    channelAvatarUrl: channel.avatarUrl,
    views: `${data.view_count?.text || '0'}回視聴`,
    uploadedAt: data.published?.text || '',
    description: data.description || '',
    likes: formatNumber(data.like_count?.text || '0'),
    dislikes: '0',
    channel: channel,
    relatedVideos: relatedVideos,
    comments: comments
  };
}

export async function getVideosByIds(videoIds: string[]): Promise<Video[]> {
    if (videoIds.length === 0) return [];
    
    // Fetch details for each video in parallel
    const promises = videoIds.map(id => 
        proxyApiFetch(`/details?id=${id}`)
            .then(mapProxyItemToVideo)
            .catch(err => {
                console.error(`Failed to fetch video ${id}`, err);
                return null;
            })
    );
    const results = await Promise.all(promises);
    return results.filter((v): v is Video => v !== null);
}

export async function getChannelDetails(channelId: string): Promise<ChannelDetails> {
    const data = await proxyApiFetch(`/channel?id=${channelId}`);
    if (!data.id) throw new Error(`ID ${channelId} のチャンネルが見つかりません。`);
    
    return {
        id: data.id,
        name: data.name,
        avatarUrl: data.thumbnails?.find((t:any) => t.width > 150)?.url || data.thumbnails?.[0]?.url,
        subscriberCount: `チャンネル登録者数 ${data.subscriber_count?.text || ''}`,
        bannerUrl: data.banner?.find((b: any) => b.width > 1000)?.url,
    };
}

export async function getChannelVideos(channelId: string, pageToken = ''): Promise<{videos: Video[], nextPageToken?: string}> {
    // Note: The proxy API might use different pagination (e.g., cursor). Adjust if needed.
    const endpoint = `/channel/${channelId}/videos${pageToken ? `?cursor=${pageToken}` : ''}`;
    const data = await proxyApiFetch(endpoint);
    
    const videos: Video[] = (data.videos || []).map(mapProxyItemToVideo).filter((v): v is Video => v !== null);
    
    return { videos, nextPageToken: data.next_page_token || undefined };
}

export async function getChannelPlaylists(channelId: string, pageToken = ''): Promise<{playlists: ApiPlaylist[], nextPageToken?: string}> {
    const endpoint = `/channel/${channelId}/playlists${pageToken ? `?cursor=${pageToken}` : ''}`;
    const data = await proxyApiFetch(endpoint);

    const playlists: ApiPlaylist[] = (data.playlists || []).map((item: any): ApiPlaylist => ({
        id: item.id,
        title: item.title,
        thumbnailUrl: item.thumbnails?.find((t:any) => t.width > 300)?.url || item.thumbnails?.[0]?.url,
        videoCount: item.video_count || 0,
    }));
    return { playlists, nextPageToken: data.next_page_token || undefined };
}

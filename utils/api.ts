import type { Video, VideoDetails, Channel, Comment, ChannelDetails, ApiPlaylist } from '../types';

// 複数の安定した公開APIインスタンスをバックエンドとして使用します
const INSTANCES = [
  'https://invidious.projectsegfau.lt',
  'https://vid.puffyan.us',
  'https://invidious.kavin.rocks',
  'https://iv.ggtyler.dev',
  'https://invidious.io.lol',
];

let currentInstanceIndex = 0;

// --- CENTRALIZED API FETCHER WITH FALLBACKS ---
const apiFetch = async (endpoint: string) => {
  const maxRetries = INSTANCES.length;
  for (let i = 0; i < maxRetries; i++) {
    const instanceUrl = INSTANCES[currentInstanceIndex];
    const fullUrl = `${instanceUrl}/api/v1${endpoint}`;
    
    try {
      // 8秒のタイムアウトを設定
      const response = await fetch(fullUrl, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) {
        console.warn(`Instance ${instanceUrl} failed with status ${response.status}. Trying next...`);
        throw new Error(`Server error: ${response.status}`);
      }
      // 成功！JSONを返却
      return await response.json();
    } catch (error) {
      console.error(`Fetch from ${instanceUrl} failed.`, error);
      // 次のインスタンスへ
      currentInstanceIndex = (currentInstanceIndex + 1) % INSTANCES.length;
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

const mapInvidiousItemToVideo = (item: any): Video | null => {
    if (item.type !== 'video' || !item.videoId) return null;
    const bestThumbnail = item.videoThumbnails?.find((t: any) => t.quality === 'medium') || item.videoThumbnails?.[0];
    
    return {
        id: item.videoId,
        thumbnailUrl: bestThumbnail?.url || '',
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
     const bestThumbnail = item.videoThumbnails?.find((t: any) => t.quality === 'medium') || item.videoThumbnails?.[0];
    return {
        id: item.videoId,
        thumbnailUrl: bestThumbnail?.url || '',
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


// --- EXPORTED API FUNCTIONS ---

export async function getRecommendedVideos(): Promise<{videos: Video[], nextPageToken?: string}> {
  const data = await apiFetch('/trending');
  if (!Array.isArray(data)) throw new Error("Invalid data format from trending API.");
  const videos = data.map(mapInvidiousItemToVideo).filter((v): v is Video => v !== null);
  return { videos, nextPageToken: undefined };
}

export async function searchVideos(query: string, pageToken = '', channelId?: string): Promise<{videos: Video[], nextPageToken?: string}> {
  const url = `/search?q=${encodeURIComponent(query)}`;
  const data = await apiFetch(url);
  if (!Array.isArray(data)) {
      console.error("Unexpected API response:", data);
      throw new Error("Invalid data format from search API.");
  }
  let videos = data.map(mapInvidiousItemToVideo).filter((v): v is Video => v !== null);
  
  if (channelId) {
      videos = videos.filter(v => v.channelId === channelId);
  }
  
  return { videos, nextPageToken: undefined }; // Invidious search doesn't support pagination
}

export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
  const [videoData, commentsData] = await Promise.all([
      apiFetch(`/videos/${videoId}`),
      apiFetch(`/comments/${videoId}`).catch(() => ({ comments: [] })) // コメント取得が失敗してもページ全体が壊れないようにする
  ]);

  const channel: Channel = {
    id: videoData.authorId,
    name: videoData.author,
    avatarUrl: videoData.authorThumbnails?.[0]?.url || '',
    subscriberCount: `${formatNumber(videoData.subCount)}`,
  };
  
  const relatedVideos: Video[] = (videoData.recommendedVideos || []).map(mapInvidiousItemToVideo).filter((v): v is Video => v !== null);

  const comments: Comment[] = (commentsData.comments || []).map((item: any): Comment => ({
    id: item.commentId,
    author: item.author,
    authorAvatarUrl: item.authorThumbnails?.[0]?.url,
    text: item.contentHtml, // HTML形式のコメントを利用
    likes: formatNumber(item.likeCount),
    publishedAt: item.publishedText,
  }));

  return {
    ...mapInvidiousDetailsToVideo(videoData),
    description: videoData.descriptionHtml, // HTML形式の概要を利用
    likes: formatNumber(videoData.likeCount),
    dislikes: '0', // APIから提供されない
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
        subscriberCount: `チャンネル登録者数 ${formatNumber(data.subCount)}`,
        bannerUrl: data.authorBanners?.find((b: any) => b.width > 1000)?.url,
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
        thumbnailUrl: item.videos?.[0]?.videoThumbnails?.find((t:any) => t.quality === "medium")?.url,
        videoCount: item.videoCount,
    }));
    
    const hasMore = playlists.length > 0;
    return { playlists, nextPageToken: hasMore ? String(page + 1) : undefined };
}
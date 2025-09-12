import type { Video, VideoDetails, Channel, Comment, ChannelDetails, ApiPlaylist } from '../types';

// 複数の安定した公開APIインスタンスをバックエンドとして使用します
// サーバーリストを更新し、より多くの安定したインスタンスを含めました
const INSTANCES = [
  'https://vid.puffyan.us',
  'https://invidious.kavin.rocks',
  'https://iv.ggtyler.dev',
  'https://invidious.nerdvpn.de',
  'https://invidious.lunar.icu',
  'https://inv.odyssey346.dev',
  'https://invidious.slipfox.xyz',
];

// --- CENTRALIZED API FETCHER WITH FALLBACKS ---
// 堅牢性を高めるためにAPI取得ロジックを改善しました
const apiFetch = async (endpoint: string) => {
  // 毎回リストをシャッフルして、特定のエンドポイントへの負荷を分散させます
  const shuffledInstances = [...INSTANCES].sort(() => Math.random() - 0.5);

  for (const instanceUrl of shuffledInstances) {
    const fullUrl = `${instanceUrl}/api/v1${endpoint}`;
    
    try {
      // 応答しないサーバーでの待ち時間を短縮するためにタイムアウトを5秒に設定
      const response = await fetch(fullUrl, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) {
        console.warn(`Instance ${instanceUrl} failed with status ${response.status}. Trying next...`);
        throw new Error(`Server error: ${response.status}`);
      }
      // 成功！JSONを返却
      return await response.json();
    } catch (error) {
      console.error(`Fetch from ${instanceUrl} failed. Retrying with next instance.`, error);
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

// --- NEW SEARCH HELPERS ---
const parseDurationToSeconds = (duration: string): number => {
    if (!duration || duration === 'N/A') return 0;
    const parts = duration.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 3) { // HH:MM:SS
        seconds += parts[0] * 3600;
        seconds += parts[1] * 60;
        seconds += parts[2];
    } else if (parts.length === 2) { // MM:SS
        seconds += parts[0] * 60;
        seconds += parts[1];
    } else if (parts.length === 1) { // SS
        seconds += parts[0];
    }
    return seconds;
};

const mapXeroxSearchResultToVideo = (item: any): Video => {
    const durationInSeconds = parseDurationToSeconds(item.duration);
    return {
        id: item.id,
        thumbnailUrl: `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
        duration: item.duration || '0:00',
        isoDuration: `PT${durationInSeconds}S`,
        title: item.title,
        channelName: item.channel,
        channelId: item.channelId,
        channelAvatarUrl: item.channelIcon,
        views: '不明', // 新しいAPIでは提供されない
        uploadedAt: '', // 新しいAPIでは提供されない
    };
};


// --- EXPORTED API FUNCTIONS ---

export async function getRecommendedVideos(): Promise<{videos: Video[], nextPageToken?: string}> {
  const data = await apiFetch('/trending');
  if (!Array.isArray(data)) throw new Error("Invalid data format from trending API.");
  const videos = data.map(mapInvidiousItemToVideo).filter((v): v is Video => v !== null);
  return { videos, nextPageToken: undefined };
}

export async function searchVideos(query: string, pageToken = '', channelId?: string): Promise<{videos: Video[], nextPageToken?: string}> {
  const url = `https://xeroxapp060.vercel.app/api/search?q=${encodeURIComponent(query)}&limit=100`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
    }
    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      console.error("Unexpected API response:", data);
      throw new Error("Invalid data format from search API.");
    }

    let videos: Video[] = data.results.map(mapXeroxSearchResultToVideo);
    
    if (channelId) {
        videos = videos.filter(v => v.channelId === channelId);
    }
    
    // The new API doesn't support pagination, so nextPageToken is undefined
    return { videos, nextPageToken: undefined };
  } catch (error) {
      console.error(`Failed to fetch search results for query: ${query}`, error);
      // Re-throw the error so the UI can display it
      throw new Error('検索結果の取得に失敗しました。時間をおいて再度お試しください。');
  }
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
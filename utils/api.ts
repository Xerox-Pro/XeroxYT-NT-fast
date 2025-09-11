import type { Video, VideoDetails, Channel, Comment, ChannelDetails, ApiPlaylist } from '../types';

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// --- HELPER FUNCTIONS ---

const formatNumber = (numStr: string | number): string => {
  const num = Number(numStr);
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

// --- CENTRALIZED API FETCHER ---

const youtubeApiFetch = async (url: string, apiKey: string) => {
  if (!apiKey) {
    throw new Error("YouTube APIキーがありません。設定からAPIキーを設定してください。");
  }

  const response = await fetch(`${url}&key=${apiKey}`);

  if (!response.ok) {
    let errorJson;
    try {
      errorJson = await response.json();
    } catch (e) {
      throw new Error(`YouTube APIリクエスト失敗: ${response.status} ${response.statusText}`);
    }
    
    console.error('YouTube API Error:', JSON.stringify(errorJson, null, 2));
    const errorMessage = errorJson?.error?.message || '不明なAPIエラーが発生しました。APIキーが正しいか確認してください。';
    throw new Error(errorMessage);
  }
  
  return response.json();
};


// --- DATA FETCHING AND MAPPING ---

async function getChannelAvatars(apiKey: string, channelIds: string[]): Promise<Record<string, string>> {
  if (channelIds.length === 0) return {};
  const url = `${YOUTUBE_API_BASE_URL}/channels?part=snippet&id=${channelIds.join(',')}`;
  try {
    const data = await youtubeApiFetch(url, apiKey);
    const avatars: Record<string, string> = {};
    (data.items || []).forEach((item: any) => {
      avatars[item.id] = item.snippet.thumbnails.default.url;
    });
    return avatars;
  } catch(error) {
    console.error("チャンネルアバターの取得エラー:", error);
    return {};
  }
}

const mapApiItemToVideo = (item: any, channelAvatars: Record<string, string>): Video => {
  const videoId = typeof item.id === 'object' ? item.id.videoId : item.id;
  const snippet = item.snippet;
  const views = item.statistics?.viewCount ? `${formatNumber(item.statistics.viewCount)}回視聴` : '視聴回数不明';
  
  return {
    id: videoId,
    thumbnailUrl: snippet.thumbnails.high?.url || snippet.thumbnails.default.url,
    duration: item.contentDetails?.duration ? formatDuration(item.contentDetails.duration) : '',
    isoDuration: item.contentDetails?.duration || 'PT0S',
    title: snippet.title,
    channelName: snippet.channelTitle,
    channelId: snippet.channelId,
    channelAvatarUrl: channelAvatars[snippet.channelId] || '',
    views: views,
    uploadedAt: formatTimeAgo(snippet.publishedAt),
  };
};

// --- EXPORTED API FUNCTIONS ---

export async function getRecommendedVideos(apiKey: string, pageToken = ''): Promise<{videos: Video[], nextPageToken?: string}> {
  let url = `${YOUTUBE_API_BASE_URL}/videos?part=snippet,contentDetails,statistics&chart=mostPopular&regionCode=JP&maxResults=20`;
  if(pageToken) url += `&pageToken=${pageToken}`;
  
  const data = await youtubeApiFetch(url, apiKey);
  if (!data.items) return { videos: [] };

  const channelIds = [...new Set(data.items.map((item: any) => item.snippet.channelId))];
  const channelAvatars = await getChannelAvatars(apiKey, channelIds as string[]);

  const videos = data.items.map((item: any) => mapApiItemToVideo(item, channelAvatars));
  return { videos, nextPageToken: data.nextPageToken };
}


export async function searchVideos(apiKey: string, query: string, pageToken = ''): Promise<{videos: Video[], nextPageToken?: string}> {
  let searchUrl = `${YOUTUBE_API_BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=20&type=video&regionCode=JP`;
  if(pageToken) searchUrl += `&pageToken=${pageToken}`;

  const searchData = await youtubeApiFetch(searchUrl, apiKey);
  if (!searchData.items || searchData.items.length === 0) return { videos: [] };
  
  const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
  const detailsUrl = `${YOUTUBE_API_BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoIds}`;
  const detailsData = await youtubeApiFetch(detailsUrl, apiKey);
  if (!detailsData.items) return { videos: [] };

  const channelIds = [...new Set(detailsData.items.map((item: any) => item.snippet.channelId))];
  const channelAvatars = await getChannelAvatars(apiKey, channelIds as string[]);

  const videos = detailsData.items.map((item: any) => mapApiItemToVideo(item, channelAvatars));
  return { videos, nextPageToken: searchData.nextPageToken };
}


export async function getVideoDetails(apiKey: string, videoId: string): Promise<VideoDetails> {
  const videoDetailsUrl = `${YOUTUBE_API_BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoId}`;
  const relatedVideosUrl = `${YOUTUBE_API_BASE_URL}/search?part=snippet&relatedToVideoId=${videoId}&type=video&maxResults=15`;
  const commentsUrl = `${YOUTUBE_API_BASE_URL}/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&order=relevance`;
  
  const optionalFetch = async (url: string, fetchName: string) => {
    try {
      return await youtubeApiFetch(url, apiKey);
    } catch (e) {
      console.error(`${fetchName} のAPI呼び出し失敗:`, e);
      return null;
    }
  };

  const [videoData, relatedData, commentsData, channelData] = await (async () => {
    const mainVideoData = await youtubeApiFetch(videoDetailsUrl, apiKey);
    const videoItem = mainVideoData.items?.[0];
    if (!videoItem) throw new Error(`ID ${videoId} の動画が見つかりません。`);
    
    const channelId = videoItem.snippet.channelId;
    const channelUrl = `${YOUTUBE_API_BASE_URL}/channels?part=snippet,statistics&id=${channelId}`;

    const [related, comments, channel] = await Promise.all([
      optionalFetch(relatedVideosUrl, '関連動画'),
      optionalFetch(commentsUrl, 'コメント'),
      youtubeApiFetch(channelUrl, apiKey)
    ]);
    
    return [videoItem, related, comments, channel.items?.[0]];
  })();

  if (!channelData) throw new Error(`動画 ${videoId} のチャンネル詳細が見つかりません。`);

  const channel: Channel = {
    id: channelData.id,
    name: channelData.snippet.title,
    avatarUrl: channelData.snippet.thumbnails.default.url,
    subscriberCount: `チャンネル登録者数 ${formatNumber(channelData.statistics.subscriberCount)}人`,
  };
  
  let relatedVideos: Video[] = [];
  if (relatedData?.items?.length > 0) {
    const videos = await getVideosByIds(apiKey, relatedData.items.map((item: any) => item.id.videoId));
    relatedVideos = videos;
  }

  let comments: Comment[] = [];
  if (commentsData) {
    comments = (commentsData.items || []).map((item: any): Comment => {
        const commentSnippet = item.snippet.topLevelComment.snippet;
        return {
            id: item.id,
            author: commentSnippet.authorDisplayName,
            authorAvatarUrl: commentSnippet.authorProfileImageUrl,
            text: commentSnippet.textDisplay,
            likes: formatNumber(commentSnippet.likeCount),
            publishedAt: formatTimeAgo(commentSnippet.publishedAt),
        };
    });
  }

  return {
    id: videoData.id,
    channelId: videoData.snippet.channelId,
    thumbnailUrl: videoData.snippet.thumbnails.high.url,
    duration: formatDuration(videoData.contentDetails.duration),
    isoDuration: videoData.contentDetails.duration,
    title: videoData.snippet.title,
    channelName: videoData.snippet.channelTitle,
    channelAvatarUrl: channel.avatarUrl,
    views: `${parseInt(videoData.statistics.viewCount).toLocaleString()}回視聴`,
    uploadedAt: new Date(videoData.snippet.publishedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }),
    description: videoData.snippet.description,
    likes: formatNumber(videoData.statistics.likeCount),
    dislikes: '0',
    channel: channel,
    relatedVideos: relatedVideos,
    comments: comments
  };
}

export async function getVideosByIds(apiKey: string, videoIds: string[]): Promise<Video[]> {
    if (videoIds.length === 0) return [];
    const detailsUrl = `${YOUTUBE_API_BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}`;
    const detailsData = await youtubeApiFetch(detailsUrl, apiKey);
    if (!detailsData.items) return [];

    const channelIds = [...new Set(detailsData.items.map((item: any) => item.snippet.channelId))];
    const channelAvatars = await getChannelAvatars(apiKey, channelIds as string[]);
    
    return detailsData.items.map((item: any) => mapApiItemToVideo(item, channelAvatars));
}


export async function getChannelDetails(apiKey: string, channelId: string): Promise<ChannelDetails> {
    const url = `${YOUTUBE_API_BASE_URL}/channels?part=snippet,statistics,brandingSettings&id=${channelId}`;
    const data = await youtubeApiFetch(url, apiKey);
    const channel = data.items?.[0];
    if (!channel) throw new Error(`ID ${channelId} のチャンネルが見つかりません。`);

    return {
        id: channel.id,
        name: channel.snippet.title,
        avatarUrl: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.default.url,
        subscriberCount: `チャンネル登録者数 ${formatNumber(channel.statistics.subscriberCount)}人`,
        bannerUrl: channel.brandingSettings.image?.bannerExternalUrl,
    };
}


export async function getChannelVideos(apiKey: string, channelId: string, pageToken = ''): Promise<{videos: Video[], nextPageToken?: string}> {
    let searchUrl = `${YOUTUBE_API_BASE_URL}/search?part=snippet&channelId=${channelId}&maxResults=20&order=date&type=video`;
    if (pageToken) searchUrl += `&pageToken=${pageToken}`;

    const searchData = await youtubeApiFetch(searchUrl, apiKey);
    if (!searchData.items || searchData.items.length === 0) return { videos: [] };
    
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    const detailsUrl = `${YOUTUBE_API_BASE_URL}/videos?part=contentDetails,statistics&id=${videoIds}`;
    const detailsData = await youtubeApiFetch(detailsUrl, apiKey);
    
    const videoDetailsById = (detailsData.items || []).reduce((acc: any, item: any) => {
        acc[item.id] = {
            duration: item.contentDetails?.duration ? formatDuration(item.contentDetails.duration) : '',
            isoDuration: item.contentDetails?.duration || 'PT0S',
            views: item.statistics?.viewCount ? `${formatNumber(item.statistics.viewCount)}回視聴` : '視聴回数不明',
        };
        return acc;
    }, {});

    const videos: Video[] = searchData.items.map((item: any): Video => ({
        id: item.id.videoId,
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
        title: item.snippet.title,
        channelName: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        uploadedAt: formatTimeAgo(item.snippet.publishedAt),
        duration: videoDetailsById[item.id.videoId]?.duration || '',
        isoDuration: videoDetailsById[item.id.videoId]?.isoDuration || 'PT0S',
        views: videoDetailsById[item.id.videoId]?.views || '視聴回数不明',
        channelAvatarUrl: '', 
    }));
    
    return { videos, nextPageToken: searchData.nextPageToken };
}

export async function getChannelPlaylists(apiKey: string, channelId: string, pageToken = ''): Promise<{playlists: ApiPlaylist[], nextPageToken?: string}> {
    let url = `${YOUTUBE_API_BASE_URL}/playlists?part=snippet,contentDetails&channelId=${channelId}&maxResults=25`;
    if(pageToken) url += `&pageToken=${pageToken}`;
    
    const data = await youtubeApiFetch(url, apiKey);
    const playlists: ApiPlaylist[] = (data.items || []).map((item: any): ApiPlaylist => ({
        id: item.id,
        title: item.snippet.title,
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
        videoCount: item.contentDetails.itemCount,
    }));
    return { playlists, nextPageToken: data.nextPageToken };
}
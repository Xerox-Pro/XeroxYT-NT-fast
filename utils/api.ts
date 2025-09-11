import type { Video, VideoDetails, Channel, Comment } from '../types';

const API_KEY = process.env.API_KEY;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// --- HELPER FUNCTIONS ---

const formatNumber = (numStr: string | number): string => {
  const num = Number(numStr);
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
};

const formatDuration = (duration: string): string => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return "0:00";
  
  match.shift(); // remove full match
  
  const [hours, minutes, seconds] = match.map(val => (val ? parseInt(val.slice(0, -1), 10) : 0));

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatTimeAgo = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)} years ago`;
  interval = seconds / 2592000;
  if (interval > 1) return `${Math.floor(interval)} months ago`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)} days ago`;
  interval = seconds / 3600;
  if (interval > 1) return `${Math.floor(interval)} hours ago`;
  interval = seconds / 60;
  if (interval > 1) return `${Math.floor(interval)} minutes ago`;
  return `${Math.floor(seconds)} seconds ago`;
};

// --- CENTRALIZED API FETCHER ---

const youtubeApiFetch = async (url: string) => {
  if (!API_KEY) {
    throw new Error("YouTube API key is missing. Please set the API_KEY environment variable.");
  }

  const response = await fetch(url);

  if (!response.ok) {
    let errorJson;
    try {
      errorJson = await response.json();
    } catch (e) {
      throw new Error(`YouTube API request failed: ${response.status} ${response.statusText}`);
    }
    
    console.error('YouTube API Error:', JSON.stringify(errorJson, null, 2));

    const errorMessage = errorJson?.error?.message || 'An unknown API error occurred.';

    const isApiKeyInvalid = errorJson?.error?.details?.some(
      (detail: any) => detail.reason === 'API_KEY_INVALID'
    );

    if (isApiKeyInvalid) {
      throw new Error("API key not valid. Please ensure your API_KEY environment variable is configured correctly.");
    }

    throw new Error(errorMessage);
  }
  
  return response.json();
};


// --- DATA FETCHING AND MAPPING ---

async function getChannelAvatars(channelIds: string[]): Promise<Record<string, string>> {
  if (channelIds.length === 0) return {};
  const url = `${YOUTUBE_API_BASE_URL}/channels?part=snippet&id=${channelIds.join(',')}&key=${API_KEY}`;
  try {
    const data = await youtubeApiFetch(url);
    const avatars: Record<string, string> = {};
    data.items.forEach((item: any) => {
      avatars[item.id] = item.snippet.thumbnails.default.url;
    });
    return avatars;
  } catch(error) {
    console.error("Error fetching channel avatars:", error);
    // Propagate the error to let the caller decide how to handle it
    throw error;
  }
}

const mapApiItemToVideo = (item: any, channelAvatars: Record<string, string>): Video => {
  const videoId = typeof item.id === 'object' ? item.id.videoId : item.id;
  const snippet = item.snippet;
  const views = item.statistics?.viewCount ? `${formatNumber(item.statistics.viewCount)} views` : 'Views unavailable';
  
  return {
    id: videoId,
    thumbnailUrl: snippet.thumbnails.high?.url || snippet.thumbnails.default.url,
    duration: item.contentDetails?.duration ? formatDuration(item.contentDetails.duration) : '',
    title: snippet.title,
    channelName: snippet.channelTitle,
    channelAvatarUrl: channelAvatars[snippet.channelId] || '',
    views: views,
    uploadedAt: formatTimeAgo(snippet.publishedAt),
  };
};

// --- EXPORTED API FUNCTIONS ---

export async function getRecommendedVideos(): Promise<Video[]> {
  const url = `${YOUTUBE_API_BASE_URL}/videos?part=snippet,contentDetails,statistics&chart=mostPopular&regionCode=US&maxResults=20&key=${API_KEY}`;
  const data = await youtubeApiFetch(url);
  if (!data.items) return [];

  const channelIds = [...new Set(data.items.map((item: any) => item.snippet.channelId))];
  const channelAvatars = await getChannelAvatars(channelIds as string[]);

  return data.items.map((item: any) => mapApiItemToVideo(item, channelAvatars));
}


export async function searchVideos(query: string): Promise<Video[]> {
  const searchUrl = `${YOUTUBE_API_BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=20&type=video&key=${API_KEY}`;
  const searchData = await youtubeApiFetch(searchUrl);
  if (!searchData.items || searchData.items.length === 0) return [];
  
  const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
  const detailsUrl = `${YOUTUBE_API_BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${API_KEY}`;
  const detailsData = await youtubeApiFetch(detailsUrl);
  if (!detailsData.items) return [];

  const channelIds = [...new Set(detailsData.items.map((item: any) => item.snippet.channelId))];
  const channelAvatars = await getChannelAvatars(channelIds as string[]);

  return detailsData.items.map((item: any) => mapApiItemToVideo(item, channelAvatars));
}


export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
  const videoDetailsUrl = `${YOUTUBE_API_BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${API_KEY}`;
  const relatedVideosUrl = `${YOUTUBE_API_BASE_URL}/search?part=snippet&relatedToVideoId=${videoId}&type=video&maxResults=15&key=${API_KEY}`;
  const commentsUrl = `${YOUTUBE_API_BASE_URL}/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&order=relevance&key=${API_KEY}`;
  
  const optionalFetch = async (url: string) => {
    try {
      return await youtubeApiFetch(url);
    } catch (e) {
      console.error(`Optional API call failed for ${new URL(url).pathname}:`, e);
      return null;
    }
  };

  const [videoData, relatedData, commentsData, channelData] = await (async () => {
    const mainVideoData = await youtubeApiFetch(videoDetailsUrl);
    const videoItem = mainVideoData.items?.[0];
    if (!videoItem) throw new Error(`Video with ID ${videoId} not found.`);
    
    const channelId = videoItem.snippet.channelId;
    const channelUrl = `${YOUTUBE_API_BASE_URL}/channels?part=snippet,statistics&id=${channelId}&key=${API_KEY}`;

    const [related, comments, channel] = await Promise.all([
      optionalFetch(relatedVideosUrl),
      optionalFetch(commentsUrl),
      youtubeApiFetch(channelUrl)
    ]);
    
    return [videoItem, related, comments, channel.items?.[0]];
  })();

  if (!channelData) throw new Error(`Channel details not found for video ${videoId}.`);

  const channel: Channel = {
    name: channelData.snippet.title,
    avatarUrl: channelData.snippet.thumbnails.default.url,
    subscriberCount: `${formatNumber(channelData.statistics.subscriberCount)} subscribers`,
  };
  
  let relatedVideos: Video[] = [];
  if (relatedData?.items?.length > 0) {
    const relatedVideoIds = relatedData.items.map((item: any) => item.id.videoId).join(',');
    const relatedDetailsUrl = `${YOUTUBE_API_BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${relatedVideoIds}&key=${API_KEY}`;
    const relatedDetailsData = await optionalFetch(relatedDetailsUrl);
    if(relatedDetailsData) {
        const relatedChannelIds = [...new Set(relatedDetailsData.items.map((item: any) => item.snippet.channelId))];
        const relatedChannelAvatars = await getChannelAvatars(relatedChannelIds as string[]).catch(() => ({}));
        relatedVideos = relatedDetailsData.items.map((item: any) => mapApiItemToVideo(item, relatedChannelAvatars));
    }
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
    thumbnailUrl: videoData.snippet.thumbnails.high.url,
    duration: formatDuration(videoData.contentDetails.duration),
    title: videoData.snippet.title,
    channelName: videoData.snippet.channelTitle,
    channelAvatarUrl: channel.avatarUrl,
    views: `${parseInt(videoData.statistics.viewCount).toLocaleString()} views`,
    uploadedAt: formatTimeAgo(videoData.snippet.publishedAt),
    description: videoData.snippet.description,
    likes: formatNumber(videoData.statistics.likeCount),
    dislikes: '0',
    channel: channel,
    relatedVideos: relatedVideos,
    comments: comments
  };
}

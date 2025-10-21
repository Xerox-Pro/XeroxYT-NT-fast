import { Innertube } from 'youtubei.js';
import type { Video, VideoDetails, Channel, ChannelDetails, ApiPlaylist, Comment, PlaylistDetails } from '../types';

// Innertubeのインスタンスをシングルトンで管理します
let youtube: Innertube | null = null;
const getYouTubeInstance = async () => {
    if (youtube) return youtube;
    youtube = await Innertube.create();
    return youtube;
};


// --- PROXIED FETCHER (getPlayerConfigでのみ使用) ---
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
  // youtubei.jsが相対時間をテキストで提供するため、この関数はあまり使われなくなりますが、
  // フォールバックとして残しておきます。
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

// --- PLAYER CONFIG FETCHER (変更なし) ---
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
const mapYouTubeiVideoToVideo = (item: any): Video | null => {
    if (!item?.id || (item?.type !== 'Video' && item?.type !== 'CompactVideo' && item?.type !== 'GridVideo')) return null;
    return {
        id: item.id,
        thumbnailUrl: item.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
        duration: item.duration?.text || '',
        isoDuration: `PT${item.duration?.seconds}S`,
        title: item.title?.text || '無題の動画',
        channelName: item.author?.name || '不明なチャンネル',
        channelId: item.author?.id || '',
        channelAvatarUrl: item.author?.thumbnails?.[0]?.url || '',
        views: item.view_count?.text || '視聴回数不明',
        uploadedAt: item.published?.text || '',
        descriptionSnippet: item.description_snippet?.text || '',
    };
};

// --- EXPORTED API FUNCTIONS (youtubei.js ver) ---

export async function getRecommendedVideos(): Promise<{videos: Video[]}> {
  const yt = await getYouTubeInstance();
  const feed = await yt.getHomeFeed();
  const videos = feed.videos
    .map(mapYouTubeiVideoToVideo)
    .filter((v): v is Video => v !== null);
  return { videos };
}

export async function searchVideos(query: string, pageToken = '', channelId?: string): Promise<{videos: Video[], nextPageToken?: string}> {
  const yt = await getYouTubeInstance();
  // TODO: pageToken を使った継続取得の実装
  const results = await yt.search(query, { type: 'video' });
  let videos = results.videos
    .map(mapYouTubeiVideoToVideo)
    .filter((v): v is Video => v !== null);

  if (channelId) {
    videos = videos.filter(v => v.channelId === channelId);
  }

  return { videos, nextPageToken: results.continuation ? 'next' : undefined };
}

export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
    const yt = await getYouTubeInstance();
    const data = await yt.getInfo(videoId);

    const channel: Channel = {
        id: data.basic_info.channel?.id || '',
        name: data.basic_info.channel?.name || '不明なチャンネル',
        avatarUrl: data.basic_info.channel?.thumbnails?.[0]?.url || '',
        subscriberCount: data.channel?.subscriber_count?.text || '非公開',
        badges: data.channel?.badges?.map((b: any) => ({ type: b.style, tooltip: b.tooltip })) || [],
    };

    const relatedVideos: Video[] = data.watch_next_feed
        .map((item: any) => mapYouTubeiVideoToVideo(item.videos?.[0] || item))
        .filter((v): v is Video => v !== null);

    return {
        id: videoId,
        thumbnailUrl: data.basic_info.thumbnail?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: formatDuration(data.basic_info.duration || 0),
        isoDuration: `PT${data.basic_info.duration || 0}S`,
        title: data.basic_info.title || '無題の動画',
        channelName: channel.name,
        channelId: channel.id,
        channelAvatarUrl: channel.avatarUrl,
        views: data.basic_info.view_count?.toLocaleString() + '回視聴',
        uploadedAt: data.basic_info.relative_date_text || '',
        description: data.basic_info.short_description?.replace(/\n/g, '<br />') || '',
        likes: formatNumber(data.basic_info.like_count || 0),
        dislikes: '0',
        channel: channel,
        relatedVideos: relatedVideos,
    };
}

export async function getComments(videoId: string): Promise<Comment[]> {
    const yt = await getYouTubeInstance();
    const commentsThread = await yt.getComments(videoId);
    return (commentsThread.contents || []).map((c: any): Comment => ({
        comment_id: c.id,
        text: c.text,
        published_time: c.published,
        author: {
            id: c.author.id,
            name: c.author.name,
            thumbnails: c.author.thumbnails,
        },
        like_count: c.vote_count.text,
        reply_count: c.reply_count,
        is_pinned: c.is_pinned,
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
    const yt = await getYouTubeInstance();
    const channel = await yt.getChannel(channelId);
    return {
        id: channel.id,
        name: channel.header?.author.name || '不明なチャンネル',
        avatarUrl: channel.header?.author.thumbnails?.[0]?.url,
        subscriberCount: channel.header?.subscriber_count.text || '非公開',
        bannerUrl: channel.header?.banner?.[0]?.url,
        description: channel.header?.description.text || '',
        videoCount: parseInt(channel.header?.videos_count.text?.replace(/,/g, '') || '0', 10),
        handle: channel.header?.handle?.text,
    };
}

export async function getChannelVideos(channelId: string, pageToken?: string): Promise<{videos: Video[], nextPageToken?: string}> {
    const yt = await getYouTubeInstance();
    const channel = await yt.getChannel(channelId);
    const videos_tab = await channel.getVideos();
    const videos: Video[] = videos_tab.videos
        .map(mapYouTubeiVideoToVideo)
        .filter((v): v is Video => v !== null);
    return { videos, nextPageToken: videos_tab.continuation ? 'next' : undefined };
}

export async function getChannelPlaylists(channelId: string, pageToken?: string): Promise<{playlists: ApiPlaylist[], nextPageToken?: string}> {
    const yt = await getYouTubeInstance();
    const channel = await yt.getChannel(channelId);
    const playlists_tab = await channel.getPlaylists();
    const playlists: ApiPlaylist[] = (playlists_tab.playlists || []).map((item: any): ApiPlaylist => ({
        id: item.id,
        title: item.title.text,
        thumbnailUrl: item.thumbnails?.[0]?.url,
        videoCount: item.video_count,
        author: channel.header?.author.name,
        authorId: channel.id,
    }));
    return { playlists, nextPageToken: playlists_tab.continuation ? 'next' : undefined };
}

export async function getPlaylistDetails(playlistId: string): Promise<PlaylistDetails> {
    const yt = await getYouTubeInstance();
    const playlist = await yt.getPlaylist(playlistId);
    const videos = (playlist.videos || [])
      .map(mapYouTubeiVideoToVideo)
      .filter((v): v is Video => v !== null);
      
    return {
        title: playlist.info.title || '無題のプレイリスト',
        author: playlist.info.author?.name || '不明な作成者',
        authorId: playlist.info.author?.id || '',
        description: playlist.info.description || '',
        videos: videos
    };
}

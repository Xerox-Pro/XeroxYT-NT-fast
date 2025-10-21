import { Innertube } from 'youtubei';
import type { Video, VideoDetails, Channel, ChannelDetails, PlaylistDetails, Comment } from '../types';

let youtube: Innertube | null = null;

// YouTubei.js 初期化
async function initializeYoutube() {
  if (!youtube) {
    youtube = await Innertube.create();
  }
}

// 動画詳細を取得
export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
  await initializeYoutube();
  if (!youtube) throw new Error('YouTube client not initialized');

  const video = await youtube.getDetails(videoId);

  return {
    id: video.id,
    title: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnails[0]?.url || '',
    duration: video.duration,
    isoDuration: video.duration,
    views: video.view_count.toString(),
    uploadedAt: video.published_time,
    likes: video.like_count.toString(),
    dislikes: '0', // dislikes は非公開
    channel: {
      id: video.author.id,
      name: video.author.name,
      avatarUrl: video.author.thumbnails[0]?.url || '',
      subscriberCount: video.author.subscriber_count,
    },
    relatedVideos: [], // 必要に応じて関連動画を取得する処理を追加
  };
}

// トレンド動画を取得
export async function getRecommendedVideos(): Promise<{ videos: Video[] }> {
  await initializeYoutube();
  if (!youtube) throw new Error('YouTube client not initialized');

  const trending = await youtube.getTrending();

  const videos = trending.videos.map((video) => ({
    id: video.id,
    title: video.title,
    thumbnailUrl: video.thumbnails[0]?.url || '',
    duration: video.duration,
    isoDuration: video.duration,
    views: video.view_count.toString(),
    uploadedAt: video.published_time,
  }));

  return { videos };
}

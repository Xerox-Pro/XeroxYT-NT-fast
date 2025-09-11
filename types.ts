export interface Video {
  id: string;
  thumbnailUrl: string;
  duration: string;
  title: string;
  channelName: string;
  channelAvatarUrl: string;
  views: string;
  uploadedAt: string;
}

export interface Channel {
  name: string;
  avatarUrl: string;
  subscriberCount: string;
}

export interface Comment {
  id: string;
  author: string;
  authorAvatarUrl: string;
  text: string;
  likes: string;
  publishedAt: string;
}

export interface VideoDetails extends Video {
  description: string;
  likes: string;
  dislikes: string;
  channel: Channel;
  relatedVideos: Video[];
  comments: Comment[];
}

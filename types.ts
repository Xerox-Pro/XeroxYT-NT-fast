

export interface Video {
  id: string;
  thumbnailUrl: string;
  duration: string;
  isoDuration: string;
  title: string;
  channelName: string;
  channelId: string;
  channelAvatarUrl: string;
  views: string;
  uploadedAt: string;
  descriptionSnippet?: string;
}

export interface Channel {
  id:string;
  name: string;
  avatarUrl: string;
  subscriberCount: string;
}

export interface ChannelDetails extends Channel {
    bannerUrl?: string;
    description?: string;
    videoCount?: number;
    handle?: string;
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

export interface Playlist {
  id: string;
  name: string;
  videoIds: string[];
  createdAt: string;
}

export interface PlaylistVideo extends Video {
  addedAt: string;
}

export interface Notification {
  id: string; // videoId
  channel: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  video: {
    id: string;
    title: string;
    thumbnailUrl: string;
  };
  publishedAt: string;
}

export interface ApiPlaylist {
  id: string;
  title: string;
  thumbnailUrl?: string;
  videoCount: number;
}
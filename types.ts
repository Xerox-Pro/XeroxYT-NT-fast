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

export interface ChannelBadge {
    type: string;
    tooltip: string;
}

export interface Channel {
  id: string;
  name: string;
  avatarUrl: string;
  subscriberCount: string;
  badges?: ChannelBadge[];
}

export interface Comment {
  id: string;
  author: string;
  authorAvatarUrl: string;
  authorChannelId: string;
  publishedAt: string;
  text: string;
  likes: string;
  replyCount: string;
  isPinned: boolean;
}

export interface SuperTitleLink {
    text: string;
    url: string;
}

export interface VideoDetails extends Video {
  description: string;
  likes: string;
  dislikes: string;
  channel: Channel;
  relatedVideos: Video[];
  comments: Comment[];
  superTitleLinks?: SuperTitleLink[];
}

export interface ChannelDetails {
  id: string;
  name: string;
  avatarUrl?: string;
  subscriberCount: string;
  bannerUrl?: string;
  description: string;
  videoCount: number;
  handle?: string;
}

export interface ApiPlaylist {
  id: string;
  title: string;
  thumbnailUrl?: string;
  videoCount: number;
}

export interface Playlist {
  id: string;
  name: string;
  videoIds: string[];
  createdAt: string;
}

export interface Notification {
  id: string;
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
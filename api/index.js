import express from "express";
import { Innertube } from "youtubei.js";

// Expressアプリを初期化
const app = express();

// CORSを許可するミドルウェア
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// 検索 API (/api/search)
app.get('/api/search', async (req, res) => {
  try {
    const youtube = await Innertube.create();
    const { q: query, limit = '50' } = req.query;
    if (!query) return res.status(400).json({ error: "Missing search query" });
    const limitNumber = parseInt(limit);
    let search = await youtube.search(query, { type: "video" });
    let videos = search.videos || [];
    while (videos.length < limitNumber && search.has_continuation) {
        search = await search.getContinuation();
        videos = videos.concat(search.videos);
    }
    res.status(200).json(videos.slice(0, limitNumber));
  } catch (err) {
    console.error('Error in /api/search:', err);
    res.status(500).json({ error: err.message });
  }
});

// 動画詳細 API (/api/video)
app.get('/api/video', async (req, res) => {
  try {
    const youtube = await Innertube.create();
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing video id" });
    const info = await youtube.getInfo(id);
    if (info.watch_next_feed) {
      info.watch_next_feed = info.watch_next_feed.slice(0, 50);
    }
    res.status(200).json(info);
  } catch (err) {
    console.error('Error in /api/video:', err);
    res.status(500).json({ error: err.message });
  }
});

// コメント API (/api/comments)
app.get('/api/comments', async (req, res) => {
  try {
    const youtube = await Innertube.create();
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing video id" });
    const limit = 300;
    let commentsSection = await youtube.getComments(id);
    let allComments = commentsSection.contents || [];
    while (allComments.length < limit && commentsSection.has_continuation) {
      commentsSection = await commentsSection.getContinuation();
      allComments = allComments.concat(commentsSection.contents);
    }
    res.status(200).json({
      comments: allComments.slice(0, limit).map(c => ({
        text: c.comment?.content?.text ?? null,
        comment_id: c.comment?.comment_id ?? null,
        published_time: c.comment?.published_time ?? null,
        author: {
          id: c.comment?.author?.id ?? null,
          name: c.comment?.author?.name ?? null,
          thumbnails: c.comment?.author?.thumbnails ?? [],
        },
        like_count: c.comment?.like_count?.toString() ?? '0',
        reply_count: c.comment?.reply_count?.toString() ?? '0',
        is_pinned: c.comment?.is_pinned ?? false
      }))
    });
  } catch (err) {
    console.error('Error in /api/comments:', err);
    res.status(500).json({ error: err.message });
  }
});

// チャンネル詳細・動画一覧 API (/api/channel)
app.get('/api/channel', async (req, res) => {
  try {
    const youtube = await Innertube.create({ lang: "ja", location: "JP" });
    const { id, page = '1' } = req.query;
    if (!id) return res.status(400).json({ error: "Missing channel id" });
    const channel = await youtube.getChannel(id);
    let videosFeed = await channel.getVideos();
    for (let i = 1; i < parseInt(page); i++) {
      if (videosFeed.has_continuation) {
        videosFeed = await videosFeed.getContinuation();
      } else {
        videosFeed.videos = [];
        break;
      }
    }
    res.status(200).json({
      channel: {
        id: channel.id,
        name: channel.metadata?.title || null,
        description: channel.metadata?.description || null,
        avatar: channel.metadata?.avatar || null,
        banner: channel.metadata?.banner || null,
        subscriberCount: channel.metadata?.subscriber_count?.pretty || '非公開',
        videoCount: channel.metadata?.videos_count ?? 0
      },
      page: parseInt(page),
      videos: videosFeed.videos || []
    });
  } catch (err) {
    console.error('Error in /api/channel:', err);
    res.status(500).json({ error: err.message });
  }
});

// チャンネルのプレイリスト一覧 API (/api/channel-playlists)
app.get('/api/channel-playlists', async (req, res) => {
  try {
    const youtube = await Innertube.create({ lang: "ja", location: "JP" });
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing channel id" });
    const channel = await youtube.getChannel(id);
    const playlists = await channel.getPlaylists();
    res.status(200).json(playlists);
  } catch (err) {
    console.error('Error in /api/channel-playlists:', err);
    res.status(500).json({ error: err.message });
  }
});

// プレイリスト詳細 API (/api/playlist)
app.get('/api/playlist', async (req, res) => {
  try {
    const youtube = await Innertube.create({ lang: "ja", location: "JP" });
    const { id: playlistId } = req.query;
    if (!playlistId) return res.status(400).json({ error: "Missing playlist id" });
    const playlist = await youtube.getPlaylist(playlistId);
    if (!playlist.info?.id) return res.status(404).json({ error: "Playlist not found"});
    res.status(200).json(playlist);
  } catch (err) {
    console.error('Error in /api/playlist:', err);
    res.status(500).json({ error: err.message });
  }
});

// 急上昇（音楽） API (/api/fvideo)
app.get('/api/fvideo', async (req, res) => {
  try {
    const youtube = await Innertube.create({ lang: "ja", location: "JP" });
    const trending = await youtube.getTrending("Music");
    res.status(200).json(trending);
  } catch (err) {
    console.error('Error in /api/fvideo:', err);
    res.status(500).json({ error: err.message });
  }
});

// Vercelは `export default app` を解釈してサーバーレス関数として実行してくれる
export default app;

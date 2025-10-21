import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) {
      youtube = await Innertube.create({ lang: "ja", location: "JP" });
    }
    const { id, page = '1' } = req.query;
    if (!id) {
      return res.status(400).json({ error: "Missing channel id" });
    }
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
        subscriberCount: channel.metadata?.subscriber_count?.pretty || '非公開'
      },
      page: parseInt(page),
      videos: videosFeed.videos || []
    });
  } catch (err) {
    console.error('Error in /api/channel:', err);
    res.status(500).json({ error: err.message });
  }
}```

**`api/comments.js`**
```javascript
import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) youtube = await Innertube.create();
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
}import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) {
      youtube = await Innertube.create({ lang: "ja", location: "JP" });
    }

    const { id, page = '1' } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Missing channel id" });
    }

    const channel = await youtube.getChannel(id);
    let videosFeed = await channel.getVideos();
    
    // ページネーションのループを正しく修正
    for (let i = 1; i < parseInt(page); i++) {
      if (videosFeed.has_continuation) {
        // feed自体を次のページのオブジェクトで更新する
        videosFeed = await videosFeed.getContinuation();
      } else {
        videosFeed.videos = []; // 続きがない場合は動画を空にする
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
        subscriberCount: channel.metadata?.subscriber_count?.pretty || '非公開'
      },
      page: parseInt(page),
      videos: videosFeed.videos || []
    });

  } catch (err) {
    console.error('Error in /api/channel:', err);
    res.status(500).json({ error: err.message });
  }
}

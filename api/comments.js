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

    // コメントの続きを正しく取得するループ
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
}

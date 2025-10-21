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

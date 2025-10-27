import { Innertube } from "youtubei.js";

let youtube;

function collectVideoArrays(obj, results = [], depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 5) return results;
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (Array.isArray(v) && v.length > 0 && (v[0]?.id || v[0]?.videoId || v[0]?.video)) {
      // push items that look like videos
      results.push(...v);
    } else if (typeof v === "object") {
      collectVideoArrays(v, results, depth + 1);
    }
  }
  return results;
}

export default async function handler(req, res) {
  try {
    if (!youtube) {
      // 常に同じロケールで作る（他のファイルと揃える）
      youtube = await Innertube.create({ lang: "ja", location: "JP" });
    }
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing video id" });

    const info = await youtube.getInfo(id);

    // 1) まず既存の watch_next_feed を使う
    let related = Array.isArray(info.watch_next_feed) ? info.watch_next_feed.slice() : [];

    // 2) 無ければ他の一般的なフィールドを探す
    if (related.length === 0) {
      const candidates = [];
      // 直接の候補フィールド
      if (Array.isArray(info.related_videos)) candidates.push(...info.related_videos);
      if (Array.isArray(info.related)) candidates.push(...info.related);
      // 深さ探索で動画っぽい配列を探す（secondaryResults, endScreens 等）
      candidates.push(...collectVideoArrays(info));
      // remove duplicates by id if possible
      const seen = new Set();
      related = candidates.filter(item => {
        const vid = item?.id || item?.videoId || (item?.video && item.video?.id);
        if (!vid) return false;
        if (seen.has(vid)) return false;
        seen.add(vid);
        return true;
      });
    }

    // 上限をつける（既存実装と一致させる）
    if (related && related.length) {
      info.watch_next_feed = related.slice(0, 50);
    } else {
      info.watch_next_feed = [];
    }

    // （デバッグ）必要なら一時ログを出す: console.log("related count:", info.watch_next_feed.length);
    res.status(200).json(info);
  } catch (err) {
    console.error('Error in /api/video:', err);
    res.status(500).json({ error: err.message });
  }
}

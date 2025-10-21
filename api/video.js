import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) youtube = await Innertube.create();
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
}

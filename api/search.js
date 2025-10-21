import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) youtube = await Innertube.create();
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
}

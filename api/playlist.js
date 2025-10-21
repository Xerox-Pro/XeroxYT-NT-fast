// api/playlist.js
import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) {
      youtube = await Innertube.create({ lang: "ja", location: "JP" });
    }

    const playlistId = req.query.id;
    if (!playlistId) {
      return res.status(400).json({ error: "Missing playlist id" });
    }

    // getPlaylistは動画一覧も一緒に取得します
    const playlist = await youtube.getPlaylist(playlistId);
    if (!playlist.info.id) {
        return res.status(404).json({ error: "Playlist not found"});
    }

    res.status(200).json(playlist);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// api/channel-playlists.js
import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) {
      youtube = await Innertube.create({ lang: "ja", location: "JP" });
    }

    const id = req.query.id;
    if (!id) {
      return res.status(400).json({ error: "Missing channel id" });
    }

    const channel = await youtube.getChannel(id);
    const playlists = await channel.getPlaylists();

    res.status(200).json(playlists);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

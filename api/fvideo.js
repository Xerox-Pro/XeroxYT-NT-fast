import { Innertube } from "youtubei.js";

let youtube;

export default async function handler(req, res) {
  try {
    if (!youtube) {
      youtube = await Innertube.create({ lang: "ja", location: "JP" });
    }
    const trending = await youtube.getTrending("Music");
    res.status(200).json(trending);
  } catch (err)
 {
    console.error('Error in /api/fvideo:', err);
    res.status(500).json({ error: err.message });
  }
}

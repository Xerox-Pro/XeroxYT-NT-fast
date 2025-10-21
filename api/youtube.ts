import { Innertube, UniversalCache } from 'youtubei.js';

export const config = {
  runtime: 'edge',
};

let youtube: Innertube;

// Innertubeインスタンスを初期化します。
// UniversalCacheを使用することで、Edge環境でのパフォーマンスを向上させます。
async function getInnertubeInstance() {
    if (!youtube) {
        youtube = await Innertube.create({ cache: new UniversalCache(true) });
    }
    return youtube;
}

// Vercel Edge Functionのメインハンドラ
export default async function handler(req: Request): Promise<Response> {
  // CORSプリフライトリクエストを処理します
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const commonHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60', // 1時間CDNにキャッシュ
  };

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const yt = await getInnertubeInstance();
    let data;

    switch (action) {
      case 'search': {
        const q = url.searchParams.get('q');
        if (!q) throw new Error('Query parameter "q" is required for search.');
        data = await yt.search(q);
        break;
      }
      case 'videoDetails': {
        const id = url.searchParams.get('id');
        if (!id) throw new Error('Parameter "id" is required for videoDetails.');
        data = await yt.getInfo(id);
        break;
      }
      case 'comments': {
        const id = url.searchParams.get('id');
        if (!id) throw new Error('Parameter "id" is required for comments.');
        const commentsThread = await yt.getComments(id);
        data = commentsThread;
        break;
      }
      case 'channelDetails': {
        const id = url.searchParams.get('id');
        if (!id) throw new Error('Parameter "id" is required for channelDetails.');
        data = await yt.getChannel(id);
        break;
      }
      case 'channelVideos': {
        const id = url.searchParams.get('id');
        if (!id) throw new Error('Parameter "id" is required for channelVideos.');
        const page = url.searchParams.get('pageToken') || '';
        const channel = await yt.getChannel(id);
        data = await channel.getVideos(page);
        break;
      }
      case 'channelPlaylists': {
        const id = url.searchParams.get('id');
        if (!id) throw new Error('Parameter "id" is required for channelPlaylists.');
        const channel = await yt.getChannel(id);
        data = await channel.getPlaylists();
        break;
      }
      case 'playlistDetails': {
        const id = url.searchParams.get('id');
        if (!id) throw new Error('Parameter "id" is required for playlistDetails.');
        data = await yt.getPlaylist(id);
        break;
      }
      case 'trending': {
        data = await yt.getTrending();
        break;
      }
      default:
        throw new Error('Invalid or missing "action" parameter.');
    }

    return new Response(JSON.stringify(data), { status: 200, headers: commonHeaders });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...commonHeaders, 'Cache-Control': 'no-cache' },
    });
  }
}

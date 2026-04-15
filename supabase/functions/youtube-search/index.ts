const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("q");
    const maxResults = url.searchParams.get("maxResults") || "3";

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Query parameter 'q' is required (min 2 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "YouTube API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ytUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    ytUrl.searchParams.set("part", "snippet");
    ytUrl.searchParams.set("q", query.trim());
    ytUrl.searchParams.set("maxResults", maxResults);
    ytUrl.searchParams.set("type", "video");
    ytUrl.searchParams.set("order", "relevance");
    ytUrl.searchParams.set("videoDuration", "medium");
    ytUrl.searchParams.set("safeSearch", "strict");
    ytUrl.searchParams.set("key", apiKey);

    const resp = await fetch(ytUrl.toString(), {
      headers: {
        "Referer": "https://cominghomeiq.lovable.app",
      },
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("YouTube API error:", resp.status, errText);
      return new Response(
        JSON.stringify({ error: "YouTube API request failed", status: resp.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await resp.json();

    const videos = (data.items || []).map((item: any) => ({
      videoId: item.id?.videoId,
      title: item.snippet?.title,
      description: item.snippet?.description,
      channelTitle: item.snippet?.channelTitle,
      thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
      publishedAt: item.snippet?.publishedAt,
    }));

    return new Response(JSON.stringify({ videos }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("youtube-search error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

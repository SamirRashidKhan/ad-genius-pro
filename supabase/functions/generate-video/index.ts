import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VideoSegment {
  imageUrl: string;
  startTime: number;
  endTime: number;
  caption?: string;
}

interface GenerateVideoRequest {
  adId: string;
  segments: VideoSegment[];
  audioUrl?: string;
  duration: number;
  title: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { adId, segments, audioUrl, duration, title }: GenerateVideoRequest = await req.json();
    
    console.log("Generating complete video for ad:", adId, "with", segments.length, "segments");

    // Since we can't use FFmpeg in Deno Deploy, we'll create a downloadable package
    // with all assets and instructions, or use a video generation API
    
    // For now, create a JSON manifest that the frontend can use to 
    // create a video using browser APIs (Canvas + MediaRecorder)
    const videoManifest = {
      id: adId,
      title,
      duration,
      segments: segments.map((seg, index) => ({
        imageUrl: seg.imageUrl,
        startTime: seg.startTime,
        endTime: seg.endTime,
        duration: seg.endTime - seg.startTime,
        caption: seg.caption,
        order: index,
      })),
      audioUrl,
      createdAt: new Date().toISOString(),
    };

    // Store the manifest for potential use
    const manifestFileName = `video-manifests/${adId}/${crypto.randomUUID()}.json`;
    await supabase.storage
      .from("business-assets")
      .upload(manifestFileName, JSON.stringify(videoManifest, null, 2), {
        contentType: "application/json",
      });

    // Return the manifest for client-side video generation
    return new Response(
      JSON.stringify({
        success: true,
        manifest: videoManifest,
        message: "Video manifest created. Use client-side rendering for final video.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Video generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate video";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
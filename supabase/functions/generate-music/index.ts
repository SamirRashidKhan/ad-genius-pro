/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { createClient } from "jsr:@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ElevenLabs API key not configured");
    }

    const { prompt, duration = 30 } = await req.json();

    if (!prompt) {
      throw new Error("Music prompt is required");
    }

    console.log(`Generating music for prompt: "${prompt}" (${duration}s)`);

    const response = await fetch("https://api.elevenlabs.io/v1/music", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        duration_seconds: duration,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs error:", errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = base64Encode(audioBuffer);

    console.log("Music generated successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        audioContent: base64Audio,
        duration 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to generate music";
    console.error("Music generation error:", error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});

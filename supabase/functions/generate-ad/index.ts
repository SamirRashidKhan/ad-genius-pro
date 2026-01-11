import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdRequest {
  adId: string;
  businessId: string;
  adType: string;
  title: string;
  description?: string;
  duration: number;
  platforms: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Only log error type, not full details
      console.error("Configuration error: AI service key missing");
      throw new Error("AI service not configured");
    }

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

    const { adId, businessId, adType, title, description, duration, platforms }: AdRequest = await req.json();
    // Sanitized logging - only log IDs, not full data
    console.log("Processing ad generation:", { adId, adType, duration });

    // Fetch business data for context
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .single();

    if (bizError || !business) {
      console.error("Business fetch failed:", { businessId, errorCode: bizError?.code });
      throw new Error("Business not found");
    }

    // Fetch business assets
    const { data: assets } = await supabase
      .from("business_assets")
      .select("*")
      .eq("business_id", businessId);

    console.log("Business context loaded. Assets count:", assets?.length || 0);

    // Build rich context for AI
    const businessContext = `
Business Name: ${business.name}
Category: ${business.category || "General"}
Description: ${business.description || ""}
Brand Tone: ${business.brand_tone || "Professional"}
Marketing Goal: ${business.marketing_goal || "Brand Awareness"}
Target Audience: ${business.target_gender || "All"}, Age ${business.target_age_min || 18}-${business.target_age_max || 65}, Location: ${business.target_location || "Global"}
`;

    const platformsStr = platforms.join(", ");

    // Generate ad script using Gemini
    const scriptPrompt = `You are an expert advertising copywriter and creative director. Create a compelling ${adType} advertisement for the following business:

${businessContext}

Ad Title: ${title}
${description ? `Additional Context: ${description}` : ""}
Video Duration: ${duration} seconds
Target Platforms: ${platformsStr}

Generate:
1. A powerful hook (first 3 seconds)
2. Main message with emotional appeal
3. Key selling points (2-3 max)
4. Strong call-to-action
5. Hashtags and captions for each platform

Format your response as JSON with the following structure:
{
  "hook": "Opening line/scene description",
  "mainMessage": "Core message of the ad",
  "sellingPoints": ["Point 1", "Point 2", "Point 3"],
  "callToAction": "CTA text",
  "script": "Full ${duration}-second script with scene descriptions and timing",
  "captions": {
    "instagram": "Caption with hashtags for Instagram",
    "facebook": "Caption for Facebook",
    "youtube": "YouTube description"
  },
  "voiceoverText": "Text for AI voiceover",
  "musicSuggestion": "Background music style suggestion",
  "visualStyle": "Visual style and color recommendations"
}`;

    console.log("Starting AI script generation...");
    
    const scriptResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert advertising AI that creates viral, high-converting ads. Always respond with valid JSON." },
          { role: "user", content: scriptPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_ad_content",
              description: "Generate complete ad content with script, captions, and creative direction",
              parameters: {
                type: "object",
                properties: {
                  hook: { type: "string", description: "Opening hook for the first 3 seconds" },
                  mainMessage: { type: "string", description: "Core message of the advertisement" },
                  sellingPoints: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "2-3 key selling points"
                  },
                  callToAction: { type: "string", description: "Call to action text" },
                  script: { type: "string", description: "Full script with timing and scene descriptions" },
                  captions: {
                    type: "object",
                    properties: {
                      instagram: { type: "string" },
                      facebook: { type: "string" },
                      youtube: { type: "string" }
                    }
                  },
                  voiceoverText: { type: "string", description: "Text for voiceover narration" },
                  musicSuggestion: { type: "string", description: "Background music style" },
                  visualStyle: { type: "string", description: "Visual style recommendations" }
                },
                required: ["hook", "mainMessage", "sellingPoints", "callToAction", "script", "captions", "voiceoverText"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_ad_content" } }
      }),
    });

    if (!scriptResponse.ok) {
      if (scriptResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI service rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (scriptResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await scriptResponse.text();
      console.error("AI script generation failed:", { status: scriptResponse.status });
      throw new Error("Failed to generate ad script");
    }

    const scriptData = await scriptResponse.json();
    console.log("Script generation completed");

    let adContent;
    try {
      const toolCall = scriptData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        adContent = JSON.parse(toolCall.function.arguments);
      } else {
        // Fallback: try to parse from content
        const content = scriptData.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          adContent = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (parseError) {
      console.error("Content parsing failed");
      throw new Error("Failed to parse AI response");
    }

    if (!adContent) {
      throw new Error("No ad content generated");
    }

    // Generate promotional image if needed
    let generatedImageUrl = null;
    if (adType === "image" || adType === "both") {
      console.log("Starting image generation...");
      
      const imagePrompt = `Create a professional, high-quality promotional advertisement image for ${business.name}.
Style: ${adContent.visualStyle || "Modern, clean, professional"}
Main Message: ${adContent.hook}
Brand Category: ${business.category || "Business"}
Brand Tone: ${business.brand_tone || "Professional"}
Include visual elements that convey: ${adContent.mainMessage}
Make it suitable for ${platformsStr} advertising.
Ultra high resolution, professional advertising photography style.`;

      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            { role: "user", content: imagePrompt }
          ],
          modalities: ["image", "text"]
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        generatedImageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        console.log("Image generation completed");
      } else {
        console.log("Image generation skipped - non-critical");
      }
    }

    // Format captions with proper platform-specific content
    const platformCaptions: Record<string, string> = {};
    for (const platform of platforms) {
      platformCaptions[platform] = adContent.captions?.[platform] || 
        `${adContent.hook} ${adContent.callToAction} #${business.name?.replace(/\s+/g, "")} #ad`;
    }

    // Update advertisement with AI-generated content
    const { error: updateError } = await supabase
      .from("advertisements")
      .update({
        ai_script: adContent.script,
        ai_captions: JSON.stringify({
          hook: adContent.hook,
          mainMessage: adContent.mainMessage,
          sellingPoints: adContent.sellingPoints,
          callToAction: adContent.callToAction,
          voiceover: adContent.voiceoverText,
          music: adContent.musicSuggestion,
          visualStyle: adContent.visualStyle,
          platformCaptions: platformCaptions
        }),
        preview_url: generatedImageUrl,
        has_watermark: true,
        status: "preview_ready",
        updated_at: new Date().toISOString()
      })
      .eq("id", adId);

    if (updateError) {
      console.error("Ad update failed:", { adId, errorCode: updateError.code });
      throw new Error("Failed to save generated content");
    }

    console.log("Ad generation completed:", { adId });

    return new Response(JSON.stringify({
      success: true,
      adId,
      content: {
        hook: adContent.hook,
        mainMessage: adContent.mainMessage,
        sellingPoints: adContent.sellingPoints,
        callToAction: adContent.callToAction,
        script: adContent.script,
        voiceover: adContent.voiceoverText,
        music: adContent.musicSuggestion,
        visualStyle: adContent.visualStyle,
        captions: platformCaptions,
        previewImage: generatedImageUrl
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    // Sanitized error logging - only log error type, not full stack/message
    console.error("Ad generation error:", {
      type: error instanceof Error ? error.constructor.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error"
    });
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Ad generation failed" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

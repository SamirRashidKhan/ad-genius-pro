import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to generate signed URLs for private storage assets.
 * Handles both legacy public URLs and new file paths.
 */
export const useSignedUrl = (
  filePath: string | null | undefined,
  bucket: string = "business-assets",
  expiresIn: number = 3600 // 1 hour default
): { signedUrl: string | null; isLoading: boolean } => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getSignedUrl = async () => {
      if (!filePath) {
        setSignedUrl(null);
        return;
      }

      // If it's already a full URL (legacy public URL or external URL), use it directly
      if (filePath.startsWith("http")) {
        setSignedUrl(filePath);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, expiresIn);

        if (error) {
          console.error("Failed to get signed URL:", error);
          setSignedUrl(null);
        } else {
          setSignedUrl(data.signedUrl);
        }
      } catch (err) {
        console.error("Error getting signed URL:", err);
        setSignedUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    getSignedUrl();
  }, [filePath, bucket, expiresIn]);

  return { signedUrl, isLoading };
};

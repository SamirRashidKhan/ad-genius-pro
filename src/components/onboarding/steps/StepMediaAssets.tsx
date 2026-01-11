import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImageIcon, Video, Upload, Loader2, X, Plus } from "lucide-react";

interface StepMediaAssetsProps {
  businessId: string | null;
  userId: string;
}

interface Asset {
  id: string;
  file_url: string;
  asset_type: string;
  file_name: string;
}

export const StepMediaAssets = ({ businessId, userId }: StepMediaAssetsProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [uploadType, setUploadType] = useState<"shop_photo" | "product_photo" | "video">("product_photo");

  useEffect(() => {
    if (businessId) {
      fetchAssets();
    }
  }, [businessId]);

  const fetchAssets = async () => {
    if (!businessId) return;
    
    const { data, error } = await supabase
      .from("business_assets")
      .select("*")
      .eq("business_id", businessId);

    if (!error && data) {
      // Generate signed URLs for each asset
      const assetsWithSignedUrls = await Promise.all(
        data.map(async (asset) => {
          // Check if it's already a full URL (legacy) or a file path
          if (asset.file_url.startsWith("http")) {
            return asset;
          }
          const { data: signedData } = await supabase.storage
            .from("business-assets")
            .createSignedUrl(asset.file_url, 3600); // 1-hour expiry for display
          return {
            ...asset,
            file_url: signedData?.signedUrl || asset.file_url,
          };
        })
      );
      setAssets(assetsWithSignedUrls);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !businessId) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      if (!isVideo && !isImage) {
        toast({
          title: "Invalid file type",
          description: "Please upload images or videos only.",
          variant: "destructive",
        });
        continue;
      }

      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${isVideo ? "Videos" : "Images"} must be less than ${isVideo ? "100MB" : "10MB"}.`,
          variant: "destructive",
        });
        continue;
      }

      const fileExt = file.name.split(".").pop();
      // Use randomized filename to prevent enumeration attacks
      const fileName = `${uploadType}/${businessId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("business-assets")
        .upload(fileName, file);

      if (uploadError) {
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}.`,
          variant: "destructive",
        });
        continue;
      }

      // Use signed URLs for private bucket instead of public URLs
      const { data: signedData, error: signError } = await supabase.storage
        .from("business-assets")
        .createSignedUrl(fileName, 86400); // 24-hour expiry

      if (signError || !signedData) {
        toast({
          title: "Upload failed",
          description: `Failed to get URL for ${file.name}.`,
          variant: "destructive",
        });
        continue;
      }

      await supabase.from("business_assets").insert({
        business_id: businessId,
        file_url: fileName, // Store the file path, not the signed URL
        asset_type: uploadType,
        file_name: file.name,
      });
    }

    setIsUploading(false);
    fetchAssets();
    toast({
      title: "Upload complete",
      description: "Your assets have been saved.",
    });
  };

  const removeAsset = async (asset: Asset) => {
    await supabase.from("business_assets").delete().eq("id", asset.id);
    setAssets(assets.filter((a) => a.id !== asset.id));
    toast({
      title: "Asset removed",
      description: "The asset has been deleted.",
    });
  };

  const shopPhotos = assets.filter((a) => a.asset_type === "shop_photo");
  const productPhotos = assets.filter((a) => a.asset_type === "product_photo");
  const videos = assets.filter((a) => a.asset_type === "video");

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <ImageIcon className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Upload Your Assets</h2>
        <p className="text-muted-foreground mt-2">
          Add photos and videos for AI to use in your ads.
        </p>
      </div>

      {!businessId ? (
        <div className="text-center py-8 bg-muted/50 rounded-xl">
          <p className="text-muted-foreground">
            Complete the first step to upload assets.
          </p>
        </div>
      ) : (
        <>
          {/* Upload Type Selection */}
          <div className="flex gap-2 mb-4">
            {[
              { type: "product_photo" as const, label: "Products", icon: ImageIcon },
              { type: "shop_photo" as const, label: "Shop/Store", icon: ImageIcon },
              { type: "video" as const, label: "Videos", icon: Video },
            ].map((item) => (
              <Button
                key={item.type}
                variant={uploadType === item.type ? "default" : "outline"}
                onClick={() => setUploadType(item.type)}
                className={uploadType === item.type ? "bg-primary" : ""}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </div>

          {/* Upload Area */}
          <label className="block p-8 border-2 border-dashed border-border hover:border-primary/50 rounded-xl cursor-pointer transition-colors text-center">
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-2" />
                <p className="text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {uploadType === "video" ? "MP4, MOV up to 100MB" : "PNG, JPG up to 10MB"}
                </p>
              </>
            )}
            <input
              type="file"
              accept={uploadType === "video" ? "video/*" : "image/*"}
              multiple
              onChange={handleUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>

          {/* Uploaded Assets Grid */}
          {assets.length > 0 && (
            <div className="space-y-4 mt-6">
              {productPhotos.length > 0 && (
                <div>
                  <Label className="mb-2 block">Product Photos ({productPhotos.length})</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {productPhotos.map((asset) => (
                      <div key={asset.id} className="relative group">
                        <img
                          src={asset.file_url}
                          alt={asset.file_name}
                          className="w-full aspect-square object-cover rounded-lg border border-border"
                        />
                        <button
                          onClick={() => removeAsset(asset)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground items-center justify-center hidden group-hover:flex"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {shopPhotos.length > 0 && (
                <div>
                  <Label className="mb-2 block">Shop Photos ({shopPhotos.length})</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {shopPhotos.map((asset) => (
                      <div key={asset.id} className="relative group">
                        <img
                          src={asset.file_url}
                          alt={asset.file_name}
                          className="w-full aspect-square object-cover rounded-lg border border-border"
                        />
                        <button
                          onClick={() => removeAsset(asset)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground items-center justify-center hidden group-hover:flex"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {videos.length > 0 && (
                <div>
                  <Label className="mb-2 block">Videos ({videos.length})</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {videos.map((asset) => (
                      <div key={asset.id} className="relative group">
                        <video
                          src={asset.file_url}
                          className="w-full aspect-video object-cover rounded-lg border border-border"
                          controls
                        />
                        <button
                          onClick={() => removeAsset(asset)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground items-center justify-center hidden group-hover:flex"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

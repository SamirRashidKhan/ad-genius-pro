import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Palette, Upload, Loader2, X } from "lucide-react";
import { BusinessData } from "../OnboardingWizard";

const brandTones = [
  { value: "professional", label: "Professional", emoji: "💼" },
  { value: "friendly", label: "Friendly", emoji: "😊" },
  { value: "luxurious", label: "Luxurious", emoji: "✨" },
  { value: "playful", label: "Playful", emoji: "🎉" },
  { value: "bold", label: "Bold", emoji: "💪" },
  { value: "minimalist", label: "Minimalist", emoji: "🪷" },
  { value: "youthful", label: "Youthful", emoji: "🌟" },
  { value: "traditional", label: "Traditional", emoji: "🏛️" },
];

interface StepBrandIdentityProps {
  formData: BusinessData;
  updateFormData: (data: Partial<BusinessData>) => void;
}

export const StepBrandIdentity = ({ formData, updateFormData }: StepBrandIdentityProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Logo must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `logos/${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from("business-assets")
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
      setIsUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("business-assets")
      .getPublicUrl(fileName);

    updateFormData({ logo_url: urlData.publicUrl });
    setIsUploading(false);

    toast({
      title: "Logo uploaded!",
      description: "Your logo has been saved.",
    });
  };

  const removeLogo = () => {
    updateFormData({ logo_url: "" });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Palette className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Define Your Brand</h2>
        <p className="text-muted-foreground mt-2">
          Upload your logo and set your brand tone.
        </p>
      </div>

      {/* Logo Upload */}
      <div className="space-y-2">
        <Label>Business Logo</Label>
        <div className="flex items-center gap-4">
          {formData.logo_url ? (
            <div className="relative">
              <img
                src={formData.logo_url}
                alt="Logo"
                className="w-24 h-24 rounded-xl object-cover border border-border"
              />
              <button
                onClick={removeLogo}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Upload</span>
                </>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          )}
          <div className="text-sm text-muted-foreground">
            <p>Upload your business logo</p>
            <p className="text-xs">PNG, JPG up to 5MB</p>
          </div>
        </div>
      </div>

      {/* Brand Tone */}
      <div className="space-y-2">
        <Label>Brand Tone *</Label>
        <p className="text-sm text-muted-foreground mb-3">
          How should your ads feel? Select the tone that best represents your brand.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {brandTones.map((tone) => (
            <button
              key={tone.value}
              type="button"
              onClick={() => updateFormData({ brand_tone: tone.value })}
              className={`p-4 rounded-xl border text-left transition-all ${
                formData.brand_tone === tone.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <span className="text-2xl">{tone.emoji}</span>
              <p className="font-medium mt-2">{tone.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

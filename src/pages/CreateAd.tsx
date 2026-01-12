import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Video,
  ImageIcon,
  Sparkles,
  Clock,
  Coins,
  ArrowRight,
  Loader2,
  Instagram,
  Facebook,
  Youtube,
  Play,
  Wand2,
  CheckCircle,
  Music,
  Upload,
  X,
} from "lucide-react";
import { logError } from "@/lib/errorLogger";

interface Business {
  id: string;
  name: string;
}

const adTypes = [
  {
    id: "video",
    label: "Video Ad",
    icon: Video,
    description: "AI-generated promotional video with music & effects",
    baseTokens: 50,
  },
  {
    id: "image",
    label: "Image Ad",
    icon: ImageIcon,
    description: "Static promotional images with captions",
    baseTokens: 20,
  },
  {
    id: "both",
    label: "Video + Images",
    icon: Sparkles,
    description: "Complete package with video and image variants",
    baseTokens: 65,
  },
];

const durations = [
  { value: "15", label: "15 seconds", multiplier: 1 },
  { value: "30", label: "30 seconds", multiplier: 1.5 },
  { value: "60", label: "60 seconds", multiplier: 2 },
];

const platforms = [
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "facebook", label: "Facebook", icon: Facebook },
  { id: "youtube", label: "YouTube", icon: Youtube },
];

const CreateAd = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [tokenBalance, setTokenBalance] = useState(0);

  // Form state
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [selectedType, setSelectedType] = useState("video");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);
  
  // Audio settings
  const [audioType, setAudioType] = useState<"ai" | "browser">("ai");
  const [audioPrompt, setAudioPrompt] = useState("");
  const [browserAudioFile, setBrowserAudioFile] = useState<File | null>(null);
  const [browserAudioUrl, setBrowserAudioUrl] = useState<string>("");
  
  // Shop video upload
  const [shopVideoFile, setShopVideoFile] = useState<File | null>(null);
  const [shopVideoUrl, setShopVideoUrl] = useState<string>("");
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
      else fetchData(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchData = async (userId: string) => {
    const [businessesRes, tokensRes] = await Promise.all([
      supabase.from("businesses").select("id, name").eq("user_id", userId),
      supabase.from("user_tokens").select("balance").eq("user_id", userId).single(),
    ]);

    if (businessesRes.data) setBusinesses(businessesRes.data);
    if (tokensRes.data) setTokenBalance(tokensRes.data.balance);
    
    if (businessesRes.data?.length === 1) {
      setSelectedBusiness(businessesRes.data[0].id);
    }

    setIsLoading(false);
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleBrowserAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("audio/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an audio file (MP3, WAV, etc.)",
          variant: "destructive",
        });
        return;
      }
      setBrowserAudioFile(file);
      setBrowserAudioUrl(URL.createObjectURL(file));
    }
  };

  const handleShopVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBusiness) return;

    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file (MP4, MOV, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video must be less than 100MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingVideo(true);
    setShopVideoFile(file);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `shop-videos/${selectedBusiness}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("business-assets")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: signedData } = await supabase.storage
        .from("business-assets")
        .createSignedUrl(fileName, 86400);

      if (signedData) {
        setShopVideoUrl(fileName);
      }

      toast({
        title: "Video uploaded",
        description: "Your shop video has been uploaded successfully.",
      });
    } catch (error) {
      logError("Video upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
      setShopVideoFile(null);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const calculateTokens = () => {
    const adType = adTypes.find((t) => t.id === selectedType);
    const durationConfig = durations.find((d) => d.value === duration);
    const baseTokens = adType?.baseTokens || 50;
    const multiplier = durationConfig?.multiplier || 1;
    const platformMultiplier = 1 + (selectedPlatforms.length - 1) * 0.2;
    // Add extra tokens for AI music generation
    const audioMultiplier = audioType === "ai" ? 1.2 : 1;
    return Math.round(baseTokens * multiplier * platformMultiplier * audioMultiplier);
  };

  const handleCreate = async () => {
    if (!user) return;

    if (!selectedBusiness) {
      toast({
        title: "Select a business",
        description: "Please select a business to create an ad for.",
        variant: "destructive",
      });
      return;
    }

    if (!title) {
      toast({
        title: "Enter a title",
        description: "Please enter a title for your ad.",
        variant: "destructive",
      });
      return;
    }

    const tokensNeeded = calculateTokens();
    if (tokenBalance < tokensNeeded) {
      toast({
        title: "Insufficient tokens",
        description: `You need ${tokensNeeded} tokens. Buy more tokens to continue.`,
        variant: "destructive",
      });
      navigate("/tokens");
      return;
    }

    setIsCreating(true);
    setGenerationProgress(10);
    setGenerationStep("Creating ad record...");

    // Use secure RPC function for atomic token deduction and ad creation
    const { data: adId, error } = await supabase
      .rpc('create_ad_with_tokens', {
        _business_id: selectedBusiness,
        _title: title,
        _ad_type: selectedType,
        _duration_seconds: parseInt(duration),
        _platforms: selectedPlatforms,
        _tokens_needed: tokensNeeded
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create ad. Please try again.",
        variant: "destructive",
      });
      setIsCreating(false);
      setGenerationProgress(0);
      setGenerationStep("");
      return;
    }

    // Now call AI to generate the ad content
    setGenerationProgress(30);
    setGenerationStep("AI is analyzing your business...");

    try {
      const { data: session } = await supabase.auth.getSession();
      
      setGenerationProgress(50);
      setGenerationStep("Generating script & captions...");

      const response = await supabase.functions.invoke('generate-ad', {
        body: {
          adId,
          businessId: selectedBusiness,
          adType: selectedType,
          title,
          description,
          duration: parseInt(duration),
          platforms: selectedPlatforms,
          audioType,
          audioPrompt: audioType === "ai" ? audioPrompt : undefined,
          browserAudioUrl: audioType === "browser" ? browserAudioUrl : undefined,
          shopVideoUrl: shopVideoUrl || undefined,
        }
      });

      if (response.error) {
        throw new Error(response.error.message || "AI generation failed");
      }

      setGenerationProgress(80);
      setGenerationStep("Finalizing your ad...");

      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setGenerationProgress(100);
      setGenerationStep("Complete!");

      toast({
        title: "Ad generated!",
        description: "Your AI-powered ad is ready for preview.",
      });

      // Navigate after a brief moment to show completion
      setTimeout(() => {
        navigate(`/my-ads`);
      }, 800);

    } catch (genError) {
      logError("AI generation error:", genError);
      toast({
        title: "Partial success",
        description: "Ad created but AI generation had issues. You can retry from My Ads.",
        variant: "destructive",
      });
      navigate(`/my-ads`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const tokensNeeded = calculateTokens();
  const canAfford = tokenBalance >= tokensNeeded;

  return (
    <DashboardLayout user={user}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Ad</h1>
          <p className="text-muted-foreground mt-1">
            Let AI create stunning advertisements for your business.
          </p>
        </div>

        {businesses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Set Up Your Business First</h3>
              <p className="text-muted-foreground mb-4">
                You need to add your business details before creating ads.
              </p>
              <Button onClick={() => navigate("/business/onboarding")}>
                Add Business
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Business Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Business</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a business" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Ad Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ad Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {adTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedType === type.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <type.icon className={`w-8 h-8 mb-3 ${selectedType === type.id ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="font-semibold">{type.label}</p>
                      <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                      <p className="text-xs text-primary mt-2">{type.baseTokens} tokens base</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ad Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ad Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Ad Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Summer Sale Promotion"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Any specific requirements or ideas for your ad..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Duration (for video) */}
            {(selectedType === "video" || selectedType === "both") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Video Duration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    {durations.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDuration(d.value)}
                        className={`flex-1 p-4 rounded-xl border text-center transition-all ${
                          duration === d.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <p className="font-semibold">{d.label}</p>
                        <p className="text-xs text-muted-foreground">×{d.multiplier} tokens</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audio Settings for Video Ads */}
            {(selectedType === "video" || selectedType === "both") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Background Music
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Audio Type Selection */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAudioType("ai")}
                      className={`flex-1 p-4 rounded-xl border text-center transition-all ${
                        audioType === "ai"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Sparkles className={`w-6 h-6 mx-auto mb-2 ${audioType === "ai" ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="font-semibold">AI Generated</p>
                      <p className="text-xs text-muted-foreground mt-1">Create unique music with AI</p>
                    </button>
                    <button
                      onClick={() => setAudioType("browser")}
                      className={`flex-1 p-4 rounded-xl border text-center transition-all ${
                        audioType === "browser"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Upload className={`w-6 h-6 mx-auto mb-2 ${audioType === "browser" ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="font-semibold">Upload Your Own</p>
                      <p className="text-xs text-muted-foreground mt-1">Use your own audio file</p>
                    </button>
                  </div>

                  {/* AI Music Prompt */}
                  {audioType === "ai" && (
                    <div className="space-y-2">
                      <Label htmlFor="audioPrompt">Music Style (optional)</Label>
                      <Textarea
                        id="audioPrompt"
                        placeholder="e.g., Upbeat electronic music with energetic vibes, catchy pop tune with modern beats..."
                        value={audioPrompt}
                        onChange={(e) => setAudioPrompt(e.target.value)}
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">
                        Describe the style of music you want. Leave empty for AI to choose based on your ad.
                      </p>
                    </div>
                  )}

                  {/* Browser Audio Upload */}
                  {audioType === "browser" && (
                    <div className="space-y-3">
                      {browserAudioFile ? (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <Music className="w-8 h-8 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{browserAudioFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(browserAudioFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setBrowserAudioFile(null);
                              setBrowserAudioUrl("");
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="block p-6 border-2 border-dashed border-border hover:border-primary/50 rounded-xl cursor-pointer transition-colors text-center">
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="font-medium">Click to upload audio</p>
                          <p className="text-sm text-muted-foreground mt-1">MP3, WAV up to 20MB</p>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={handleBrowserAudioUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Shop Video Upload */}
            {(selectedType === "video" || selectedType === "both") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Shop/Product Video (Optional)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a video of your shop or products to include in the ad generation.
                  </p>
                  {shopVideoFile ? (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Video className="w-8 h-8 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{shopVideoFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(shopVideoFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      {isUploadingVideo ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShopVideoFile(null);
                            setShopVideoUrl("");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <label className={`block p-6 border-2 border-dashed border-border hover:border-primary/50 rounded-xl cursor-pointer transition-colors text-center ${!selectedBusiness ? 'opacity-50 pointer-events-none' : ''}`}>
                      {isUploadingVideo ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                          <p className="text-muted-foreground">Uploading...</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="font-medium">Click to upload shop video</p>
                          <p className="text-sm text-muted-foreground mt-1">MP4, MOV up to 100MB</p>
                        </>
                      )}
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleShopVideoUpload}
                        className="hidden"
                        disabled={isUploadingVideo || !selectedBusiness}
                      />
                    </label>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Platforms */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Target Platforms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={`flex-1 p-4 rounded-xl border text-center transition-all ${
                        selectedPlatforms.includes(platform.id)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <platform.icon className={`w-6 h-6 mx-auto mb-2 ${selectedPlatforms.includes(platform.id) ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="font-medium text-sm">{platform.label}</p>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Each additional platform adds 20% to the token cost.
                </p>
              </CardContent>
            </Card>

            {/* Summary & Create */}
            <Card className={canAfford ? "border-primary" : "border-destructive"}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-3xl font-bold flex items-center gap-2">
                      <Coins className="w-6 h-6 text-yellow-500" />
                      {tokensNeeded} tokens
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Your Balance</p>
                    <p className={`text-xl font-semibold ${canAfford ? "text-green-500" : "text-destructive"}`}>
                      {tokenBalance} tokens
                    </p>
                  </div>
                </div>

                {!canAfford && (
                  <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">
                      You need {tokensNeeded - tokenBalance} more tokens. 
                      <Button variant="link" className="text-destructive px-1" onClick={() => navigate("/tokens")}>
                        Buy tokens
                      </Button>
                    </p>
                  </div>
                )}

                {isCreating && (
                  <div className="mb-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Wand2 className="w-5 h-5 text-primary animate-pulse" />
                        <div className="absolute inset-0 animate-ping">
                          <Sparkles className="w-5 h-5 text-primary/50" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-primary">{generationStep}</p>
                        <Progress value={generationProgress} className="h-2 mt-1" />
                      </div>
                      {generationProgress === 100 && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !canAfford || !selectedBusiness || !title}
                  className="w-full h-12 bg-gradient-primary hover:opacity-90 text-white"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-2" />
                      Generate Ad with AI ({tokensNeeded} tokens)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CreateAd;

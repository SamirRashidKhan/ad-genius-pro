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
} from "lucide-react";

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
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [tokenBalance, setTokenBalance] = useState(0);

  // Form state
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [selectedType, setSelectedType] = useState("video");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);

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

  const calculateTokens = () => {
    const adType = adTypes.find((t) => t.id === selectedType);
    const durationConfig = durations.find((d) => d.value === duration);
    const baseTokens = adType?.baseTokens || 50;
    const multiplier = durationConfig?.multiplier || 1;
    const platformMultiplier = 1 + (selectedPlatforms.length - 1) * 0.2;
    return Math.round(baseTokens * multiplier * platformMultiplier);
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

    const { data: ad, error } = await supabase
      .from("advertisements")
      .insert({
        user_id: user.id,
        business_id: selectedBusiness,
        title,
        ad_type: selectedType,
        duration_seconds: parseInt(duration),
        platforms: selectedPlatforms,
        status: "processing",
        tokens_spent: tokensNeeded,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create ad. Please try again.",
        variant: "destructive",
      });
      setIsCreating(false);
      return;
    }

    // Deduct tokens
    await supabase
      .from("user_tokens")
      .update({ balance: tokenBalance - tokensNeeded })
      .eq("user_id", user.id);

    toast({
      title: "Ad created!",
      description: "Your ad is being generated. We'll notify you when it's ready.",
    });

    navigate(`/my-ads/${ad.id}`);
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

                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !canAfford || !selectedBusiness || !title}
                  className="w-full h-12 bg-gradient-primary hover:opacity-90 text-white"
                >
                  {isCreating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Generate Ad ({tokensNeeded} tokens)
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

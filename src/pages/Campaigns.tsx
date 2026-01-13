import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  BarChart3,
  Eye,
  MousePointer,
  Users,
  DollarSign,
  Video,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: string;
  platform: string;
  status: string;
  budget_inr: number | null;
  views: number | null;
  clicks: number | null;
  reach: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  ad_title: string | null;
  ad_description: string | null;
  advertisement: {
    title: string;
    preview_url: string | null;
  };
}

interface Advertisement {
  id: string;
  title: string;
  ad_type: string;
  status: string;
  preview_url: string | null;
  platforms: string[] | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-500/20 text-green-500",
  paused: "bg-yellow-500/20 text-yellow-500",
  completed: "bg-blue-500/20 text-blue-500",
};

const DAILY_CAMPAIGN_LIMIT = 3;

const Campaigns = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  
  // New campaign dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availableAds, setAvailableAds] = useState<Advertisement[]>([]);
  const [todayCampaignCount, setTodayCampaignCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [selectedAdId, setSelectedAdId] = useState<string>("");
  const [adTitle, setAdTitle] = useState("");
  const [adDescription, setAdDescription] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [budget, setBudget] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
      else {
        fetchCampaigns(session.user.id);
        fetchTodayCampaignCount(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchCampaigns = async (userId: string) => {
    const { data, error } = await supabase
      .from("campaigns")
      .select(`
        *,
        advertisement:advertisements(title, preview_url)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCampaigns(data.map(c => ({
        ...c,
        advertisement: c.advertisement as { title: string; preview_url: string | null }
      })));
    }
    setIsLoading(false);
  };

  const fetchTodayCampaignCount = async (userId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count, error } = await supabase
      .from("campaigns")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", today.toISOString());

    if (!error && count !== null) {
      setTodayCampaignCount(count);
    }
  };

  const fetchAvailableAds = async (userId: string) => {
    const { data, error } = await supabase
      .from("advertisements")
      .select("id, title, ad_type, status, preview_url, platforms")
      .eq("user_id", userId)
      .in("status", ["preview_ready", "preview", "approved"])
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAvailableAds(data);
    }
  };

  const handleOpenDialog = async () => {
    if (!user) return;
    
    if (todayCampaignCount >= DAILY_CAMPAIGN_LIMIT) {
      toast.error(`Daily limit reached! You can only create ${DAILY_CAMPAIGN_LIMIT} campaigns per day.`);
      return;
    }
    
    await fetchAvailableAds(user.id);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedAdId("");
    setAdTitle("");
    setAdDescription("");
    setSelectedPlatform("");
    setBudget("");
  };

  const handleCreateCampaign = async () => {
    if (!user) return;
    
    if (!selectedAdId) {
      toast.error("Please select an ad");
      return;
    }
    if (!adTitle.trim()) {
      toast.error("Please enter a campaign title");
      return;
    }
    if (!adDescription.trim()) {
      toast.error("Please enter ad details for viewers");
      return;
    }
    if (!selectedPlatform) {
      toast.error("Please select a platform");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          user_id: user.id,
          advertisement_id: selectedAdId,
          ad_title: adTitle.trim(),
          ad_description: adDescription.trim(),
          platform: selectedPlatform,
          budget_inr: budget ? parseFloat(budget) : null,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Campaign created successfully!");
      handleCloseDialog();
      fetchCampaigns(user.id);
      fetchTodayCampaignCount(user.id);
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Failed to create campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAd = availableAds.find(ad => ad.id === selectedAdId);

  const filteredCampaigns = activeTab === "all"
    ? campaigns
    : campaigns.filter((c) => c.status === activeTab);

  const totalStats = campaigns.reduce(
    (acc, c) => ({
      views: acc.views + (c.views || 0),
      clicks: acc.clicks + (c.clicks || 0),
      reach: acc.reach + (c.reach || 0),
      spent: acc.spent + (c.budget_inr || 0),
    }),
    { views: 0, clicks: 0, reach: 0, spent: 0 }
  );

  const remainingCampaigns = DAILY_CAMPAIGN_LIMIT - todayCampaignCount;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Campaigns</h1>
            <p className="text-muted-foreground mt-1">
              Manage your ad campaigns across platforms.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="py-1.5 px-3">
              {remainingCampaigns} / {DAILY_CAMPAIGN_LIMIT} campaigns left today
            </Badge>
            <Button 
              className="bg-gradient-primary hover:opacity-90 text-white"
              onClick={handleOpenDialog}
              disabled={remainingCampaigns === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Views", value: totalStats.views.toLocaleString(), icon: Eye, color: "text-blue-500" },
            { label: "Total Clicks", value: totalStats.clicks.toLocaleString(), icon: MousePointer, color: "text-green-500" },
            { label: "Total Reach", value: totalStats.reach.toLocaleString(), icon: Users, color: "text-purple-500" },
            { label: "Total Spent", value: `₹${totalStats.spent.toLocaleString()}`, icon: DollarSign, color: "text-yellow-500" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Campaigns List */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({campaigns.length})</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="paused">Paused</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredCampaigns.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create an ad first, then start a campaign to promote it.
                  </p>
                  <Button onClick={handleOpenDialog} disabled={remainingCampaigns === 0}>
                    Create a Campaign
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredCampaigns.map((campaign) => (
                  <Card key={campaign.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Preview Image */}
                        {campaign.advertisement?.preview_url && (
                          <div className="w-24 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <img 
                              src={campaign.advertisement.preview_url} 
                              alt={campaign.ad_title || campaign.advertisement?.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{campaign.ad_title || campaign.advertisement?.title || "Untitled"}</h3>
                                <Badge className={statusColors[campaign.status]}>
                                  {campaign.status}
                                </Badge>
                              </div>
                              {campaign.ad_description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {campaign.ad_description}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Platform: {campaign.platform} • Budget: ₹{campaign.budget_inr?.toLocaleString() || 0}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {campaign.status === "active" ? (
                                <Button variant="outline" size="sm">
                                  <Pause className="w-4 h-4 mr-1" />
                                  Pause
                                </Button>
                              ) : campaign.status === "paused" ? (
                                <Button variant="outline" size="sm">
                                  <Play className="w-4 h-4 mr-1" />
                                  Resume
                                </Button>
                              ) : null}
                              <Button variant="outline" size="sm">
                                <BarChart3 className="w-4 h-4 mr-1" />
                                Analytics
                              </Button>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                            <div>
                              <p className="text-sm text-muted-foreground">Views</p>
                              <p className="text-lg font-semibold">{(campaign.views || 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Clicks</p>
                              <p className="text-lg font-semibold">{(campaign.clicks || 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Reach</p>
                              <p className="text-lg font-semibold">{(campaign.reach || 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">CTR</p>
                              <p className="text-lg font-semibold">
                                {campaign.views ? ((campaign.clicks || 0) / campaign.views * 100).toFixed(2) : 0}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* New Campaign Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                Create New Campaign
              </DialogTitle>
              <DialogDescription>
                Select an ad from your library and add details for viewers. You can create {remainingCampaigns} more campaign(s) today.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              {/* Daily limit warning */}
              {remainingCampaigns <= 1 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 text-yellow-600 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {remainingCampaigns === 0 
                    ? "You've reached your daily limit. Try again tomorrow!"
                    : "This is your last campaign for today."
                  }
                </div>
              )}

              {/* Select Ad */}
              <div className="space-y-2">
                <Label>Select Ad from My Ads *</Label>
                <Select value={selectedAdId} onValueChange={setSelectedAdId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an ad to promote" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {availableAds.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No ads available. Create an ad first.
                      </div>
                    ) : (
                      availableAds.map((ad) => (
                        <SelectItem key={ad.id} value={ad.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {ad.ad_type}
                            </Badge>
                            {ad.title}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Ad Preview */}
              {selectedAd && selectedAd.preview_url && (
                <div className="rounded-lg overflow-hidden bg-muted aspect-video">
                  <img 
                    src={selectedAd.preview_url} 
                    alt={selectedAd.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Campaign Title */}
              <div className="space-y-2">
                <Label htmlFor="adTitle">Campaign Title *</Label>
                <Input
                  id="adTitle"
                  placeholder="Enter a catchy title for your campaign"
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  maxLength={100}
                />
              </div>

              {/* Ad Description for Viewers */}
              <div className="space-y-2">
                <Label htmlFor="adDescription">Ad Details for Viewers *</Label>
                <Textarea
                  id="adDescription"
                  placeholder="Describe what viewers will see. Include key selling points, offers, and call-to-action..."
                  value={adDescription}
                  onChange={(e) => setAdDescription(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {adDescription.length}/500 characters
                </p>
              </div>

              {/* Platform */}
              <div className="space-y-2">
                <Label>Target Platform *</Label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="twitter">Twitter/X</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Budget (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (₹) - Optional</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="Enter your budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  min={0}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateCampaign}
                  disabled={isSubmitting || !selectedAdId || !adTitle || !adDescription || !selectedPlatform}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Megaphone className="w-4 h-4 mr-2" />
                      Create Campaign
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Campaigns;
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Calendar,
  ArrowUpRight,
} from "lucide-react";

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
  advertisement: {
    title: string;
  };
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-500/20 text-green-500",
  paused: "bg-yellow-500/20 text-yellow-500",
  completed: "bg-blue-500/20 text-blue-500",
};

const Campaigns = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
      else fetchCampaigns(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchCampaigns = async (userId: string) => {
    const { data, error } = await supabase
      .from("campaigns")
      .select(`
        *,
        advertisement:advertisements(title)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCampaigns(data.map(c => ({
        ...c,
        advertisement: c.advertisement as { title: string }
      })));
    }
    setIsLoading(false);
  };

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
          <Button className="bg-gradient-primary hover:opacity-90 text-white" disabled>
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
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
                    Create an ad first, then boost it to start a campaign.
                  </p>
                  <Link to="/create-ad">
                    <Button>Create an Ad</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredCampaigns.map((campaign) => (
                  <Card key={campaign.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{campaign.advertisement?.title || "Untitled"}</h3>
                            <Badge className={statusColors[campaign.status]}>
                              {campaign.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Campaigns;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Video,
  Megaphone,
  Coins,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Eye,
  MousePointer,
  Users,
  Sparkles,
} from "lucide-react";

interface DashboardHomeProps {
  user: User;
}

interface Stats {
  tokenBalance: number;
  totalAds: number;
  activeCampaigns: number;
  totalReach: number;
}

export const DashboardHome = ({ user }: DashboardHomeProps) => {
  const [stats, setStats] = useState<Stats>({
    tokenBalance: 0,
    totalAds: 0,
    activeCampaigns: 0,
    totalReach: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch token balance
        const { data: tokensData } = await supabase
          .from("user_tokens")
          .select("balance")
          .eq("user_id", user.id)
          .single();

        // Fetch ads count
        const { count: adsCount } = await supabase
          .from("advertisements")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Fetch active campaigns count
        const { count: campaignsCount } = await supabase
          .from("campaigns")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "active");

        // Fetch total reach from campaigns
        const { data: reachData } = await supabase
          .from("campaigns")
          .select("reach")
          .eq("user_id", user.id);

        const totalReach = reachData?.reduce((acc, c) => acc + (c.reach || 0), 0) || 0;

        // Check if user has completed onboarding
        const { data: businessData } = await supabase
          .from("businesses")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .single();

        setStats({
          tokenBalance: tokensData?.balance || 0,
          totalAds: adsCount || 0,
          activeCampaigns: campaignsCount || 0,
          totalReach,
        });
        setHasCompletedOnboarding(businessData?.onboarding_completed || false);
      } catch (error) {
        logError("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user.id]);

  const statCards = [
    {
      title: "Token Balance",
      value: stats.tokenBalance,
      icon: Coins,
      href: "/tokens",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Total Ads",
      value: stats.totalAds,
      icon: Video,
      href: "/my-ads",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Campaigns",
      value: stats.activeCampaigns,
      icon: Megaphone,
      href: "/campaigns",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Total Reach",
      value: stats.totalReach.toLocaleString(),
      icon: TrendingUp,
      href: "/analytics",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ];

  const quickActions = [
    {
      title: "Create Video Ad",
      description: "Generate AI-powered video advertisements",
      icon: Video,
      href: "/create-ad",
      gradient: true,
    },
    {
      title: "Buy Tokens",
      description: "Get tokens to create more ads",
      icon: Coins,
      href: "/tokens",
    },
    {
      title: "View Analytics",
      description: "Track your campaign performance",
      icon: Eye,
      href: "/analytics",
    },
  ];

  const userName = user.user_metadata?.full_name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {userName}! 👋</h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your ads today.
          </p>
        </div>
        <Link to="/create-ad">
          <Button className="bg-gradient-primary hover:opacity-90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create New Ad
          </Button>
        </Link>
      </div>

      {/* Onboarding Banner */}
      {!hasCompletedOnboarding && !isLoading && (
        <Card className="bg-gradient-primary border-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <CardContent className="p-6 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Complete Your Business Setup</h3>
                  <p className="text-white/80">
                    Add your business details to start creating AI-powered ads.
                  </p>
                </div>
              </div>
              <Link to="/business/onboarding">
                <Button className="bg-white text-primary hover:bg-white/90">
                  Get Started
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.href}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{isLoading ? "-" : stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link key={action.title} to={action.href}>
              <Card
                className={`hover:border-primary/50 transition-all cursor-pointer h-full hover-lift ${
                  action.gradient ? "bg-gradient-primary border-0" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      action.gradient ? "bg-white/20" : "bg-primary/10"
                    }`}
                  >
                    <action.icon
                      className={`w-6 h-6 ${action.gradient ? "text-white" : "text-primary"}`}
                    />
                  </div>
                  <h3
                    className={`text-lg font-semibold mb-1 ${
                      action.gradient ? "text-white" : "text-foreground"
                    }`}
                  >
                    {action.title}
                  </h3>
                  <p className={action.gradient ? "text-white/80" : "text-muted-foreground"}>
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No recent activity</h3>
            <p className="text-muted-foreground mb-4">
              Create your first ad to see your activity here.
            </p>
            <Link to="/create-ad">
              <Button>Create Your First Ad</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

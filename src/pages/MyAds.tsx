import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Video,
  ImageIcon,
  Plus,
  Eye,
  Download,
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Maximize2,
  Play,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FullscreenPreview } from "@/components/ads/FullscreenPreview";
import { VideoAdPlayer } from "@/components/ads/VideoAdPlayer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
interface VideoSegment {
  imageUrl: string;
  startTime: number;
  endTime: number;
  caption?: string;
}

interface Advertisement {
  id: string;
  title: string;
  ad_type: string;
  status: string;
  preview_url: string | null;
  final_url: string | null;
  created_at: string;
  platforms: string[] | null;
  has_watermark: boolean;
  duration_seconds: number | null;
  video_segments: unknown;
}

// Helper to parse video segments from JSON
const parseVideoSegments = (segments: unknown): VideoSegment[] => {
  if (!segments || !Array.isArray(segments)) return [];
  return segments.filter((s): s is VideoSegment => 
    typeof s === 'object' && s !== null && 'imageUrl' in s && 'startTime' in s && 'endTime' in s
  );
};

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  draft: { label: "Draft", icon: Clock, color: "bg-muted text-muted-foreground" },
  processing: { label: "Processing", icon: Loader2, color: "bg-yellow-500/20 text-yellow-500" },
  preview: { label: "Preview Ready", icon: Eye, color: "bg-blue-500/20 text-blue-500" },
  approved: { label: "Approved", icon: CheckCircle, color: "bg-green-500/20 text-green-500" },
  rejected: { label: "Rejected", icon: XCircle, color: "bg-destructive/20 text-destructive" },
};

const MyAds = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [previewAd, setPreviewAd] = useState<Advertisement | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
      else fetchAds(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchAds = async (userId: string) => {
    const { data, error } = await supabase
      .from("advertisements")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) setAds(data);
    setIsLoading(false);
  };

  const filteredAds = activeTab === "all" 
    ? ads 
    : ads.filter((ad) => ad.status === activeTab);

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
            <h1 className="text-3xl font-bold">My Ads</h1>
            <p className="text-muted-foreground mt-1">
              Manage and view all your advertisements.
            </p>
          </div>
          <Link to="/create-ad">
            <Button className="bg-gradient-primary hover:opacity-90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create New Ad
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({ads.length})</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="preview">Preview Ready</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredAds.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No ads yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first AI-powered advertisement.
                  </p>
                  <Link to="/create-ad">
                    <Button>Create Your First Ad</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAds.map((ad) => {
                    const status = statusConfig[ad.status] || statusConfig.draft;
                    const StatusIcon = status.icon;
                    const videoSegments = parseVideoSegments(ad.video_segments);
                    const isVideoAd = ad.ad_type === "video" && videoSegments.length > 0;

                    return (
                      <Card key={ad.id} className="overflow-hidden hover:border-primary/50 transition-colors group">
                        {/* Thumbnail */}
                        <div className="aspect-video bg-muted relative">
                          {isVideoAd ? (
                            <VideoAdPlayer
                              segments={videoSegments}
                              totalDuration={ad.duration_seconds || 30}
                              onFullscreen={() => setPreviewAd(ad)}
                              className="h-full"
                            />
                          ) : ad.preview_url ? (
                            <img
                              src={ad.preview_url}
                              alt={ad.title}
                              className="w-full h-full object-cover cursor-pointer"
                              onClick={() => setPreviewAd(ad)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {ad.ad_type === "video" ? (
                                <Video className="w-12 h-12 text-muted-foreground" />
                              ) : (
                                <ImageIcon className="w-12 h-12 text-muted-foreground" />
                              )}
                            </div>
                          )}
                          
                          {/* Fullscreen button for non-video */}
                          {!isVideoAd && ad.preview_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewAd(ad);
                              }}
                            >
                              <Maximize2 className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Video indicator */}
                          {isVideoAd && (
                            <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                              <Play className="w-3 h-3" />
                              {ad.duration_seconds}s
                            </div>
                          )}

                          {/* Status Badge */}
                          <Badge className={`absolute top-2 left-2 ${status.color}`}>
                            <StatusIcon className={`w-3 h-3 mr-1 ${ad.status === "processing" ? "animate-spin" : ""}`} />
                            {status.label}
                          </Badge>

                          {/* Watermark indicator */}
                          {ad.has_watermark && ad.preview_url && !isVideoAd && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="text-white/30 text-4xl font-bold rotate-[-30deg]">
                                PREVIEW
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold truncate">{ad.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(ad.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/my-ads/${ad.id}`)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {ad.final_url && (
                                  <DropdownMenuItem>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Platforms */}
                          {ad.platforms && ad.platforms.length > 0 && (
                            <div className="flex gap-1 mt-3">
                              {ad.platforms.map((platform) => (
                                <Badge key={platform} variant="secondary" className="text-xs">
                                  {platform}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Fullscreen Preview Modal */}
          {previewAd && (
            parseVideoSegments(previewAd.video_segments).length > 0 ? (
              <Dialog open={!!previewAd} onOpenChange={(open) => !open && setPreviewAd(null)}>
                <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black/95 border-none">
                  <div className="min-h-[60vh] min-w-[60vw] p-4">
                    <VideoAdPlayer
                      segments={parseVideoSegments(previewAd.video_segments)}
                      totalDuration={previewAd.duration_seconds || 30}
                      title={previewAd.title}
                      autoPlay
                      className="w-full h-full min-h-[50vh]"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <FullscreenPreview
                open={!!previewAd}
                onOpenChange={(open) => !open && setPreviewAd(null)}
                mediaUrl={previewAd?.preview_url || previewAd?.final_url || ""}
                mediaType={previewAd?.ad_type === "video" ? "video" : "image"}
                title={previewAd?.title}
              />
            )
          )}
        </div>
      </DashboardLayout>
    );
  };

export default MyAds;

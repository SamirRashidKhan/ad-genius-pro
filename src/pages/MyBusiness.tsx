import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Edit2,
  ImageIcon,
  Target,
  Palette,
  ArrowRight,
  Plus,
  Check,
  Loader2,
} from "lucide-react";

interface Business {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  brand_tone: string | null;
  logo_url: string | null;
  target_location: string | null;
  target_age_min: number | null;
  target_age_max: number | null;
  target_gender: string | null;
  marketing_goal: string | null;
  onboarding_completed: boolean;
}

const MyBusiness = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Business>>({});

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
      else fetchBusiness(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchBusiness = async (userId: string) => {
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!error && data) {
      setBusiness(data);
      setEditData(data);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!business) return;

    setIsSaving(true);

    const { error } = await supabase
      .from("businesses")
      .update(editData)
      .eq("id", business.id);

    setIsSaving(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update business. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setBusiness({ ...business, ...editData } as Business);
    setIsEditing(false);
    toast({
      title: "Saved!",
      description: "Your business details have been updated.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (!business) {
    return (
      <DashboardLayout user={user}>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Set Up Your Business</h2>
              <p className="text-muted-foreground mb-6">
                Add your business details to start creating AI-powered ads.
              </p>
              <Button onClick={() => navigate("/business/onboarding")} className="bg-gradient-primary hover:opacity-90 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Your Business
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Business</h1>
            <p className="text-muted-foreground mt-1">
              Manage your business profile and settings.
            </p>
          </div>
          {!isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-primary hover:opacity-90 text-white">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* Business Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              {/* Logo */}
              <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border">
                {business.logo_url ? (
                  <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-10 h-10 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Business Name</Label>
                      <Input
                        value={editData.name || ""}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={editData.description || ""}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-2xl font-bold">{business.name}</h2>
                      {business.onboarding_completed && (
                        <Badge className="bg-green-500/20 text-green-500">Verified</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{business.description || "No description added"}</p>
                    <Badge variant="secondary" className="mt-2">{business.category}</Badge>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Brand Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Brand Identity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Brand Tone</p>
                  <p className="font-medium capitalize">{business.brand_tone || "Not set"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Target Audience */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Target Audience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{business.target_location || "Not set"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Age Range</p>
                  <p className="font-medium">
                    {business.target_age_min && business.target_age_max
                      ? `${business.target_age_min} - ${business.target_age_max} years`
                      : "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium capitalize">{business.target_gender || "All"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Marketing Goal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Marketing Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="text-base py-1 px-3 capitalize">
              {business.marketing_goal?.replace("_", " ") || "Not set"}
            </Badge>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex gap-4">
          <Link to="/create-ad" className="flex-1">
            <Button className="w-full bg-gradient-primary hover:opacity-90 text-white">
              Create New Ad
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/business/onboarding" className="flex-1">
            <Button variant="outline" className="w-full">
              Update Onboarding
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyBusiness;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { StepBasicInfo } from "./steps/StepBasicInfo";
import { StepBrandIdentity } from "./steps/StepBrandIdentity";
import { StepMediaAssets } from "./steps/StepMediaAssets";
import { StepTargetAudience } from "./steps/StepTargetAudience";
import { StepMarketingGoal } from "./steps/StepMarketingGoal";

export interface BusinessData {
  name: string;
  category: string;
  description: string;
  brand_tone: string;
  logo_url: string;
  target_location: string;
  target_age_min: number;
  target_age_max: number;
  target_gender: string;
  marketing_goal: string;
}

const steps = [
  { title: "Basic Info", description: "Tell us about your business" },
  { title: "Brand Identity", description: "Define your brand" },
  { title: "Media Assets", description: "Upload your visuals" },
  { title: "Target Audience", description: "Who are your customers?" },
  { title: "Marketing Goal", description: "What do you want to achieve?" },
];

interface OnboardingWizardProps {
  userId: string;
}

export const OnboardingWizard = ({ userId }: OnboardingWizardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<BusinessData>({
    name: "",
    category: "",
    description: "",
    brand_tone: "",
    logo_url: "",
    target_location: "",
    target_age_min: 18,
    target_age_max: 65,
    target_gender: "all",
    marketing_goal: "",
  });

  const updateFormData = (data: Partial<BusinessData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    // On first step, create the business record
    if (currentStep === 0 && !businessId) {
      if (!formData.name || !formData.category) {
        toast({
          title: "Required fields",
          description: "Please fill in business name and category.",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      const { data, error } = await supabase
        .from("businesses")
        .insert({
          user_id: userId,
          name: formData.name,
          category: formData.category,
          description: formData.description,
        })
        .select()
        .single();

      setIsSubmitting(false);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create business. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setBusinessId(data.id);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (!businessId) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from("businesses")
      .update({
        ...formData,
        onboarding_completed: true,
      })
      .eq("id", businessId);

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save business details. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success!",
      description: "Your business is set up. Let's create your first ad!",
    });

    navigate("/dashboard");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepBasicInfo formData={formData} updateFormData={updateFormData} />;
      case 1:
        return <StepBrandIdentity formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <StepMediaAssets businessId={businessId} userId={userId} />;
      case 3:
        return <StepTargetAudience formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <StepMarketingGoal formData={formData} updateFormData={updateFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{steps[currentStep].title}</h1>
              <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
          <Progress value={progress} className="mt-4 h-2" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        {renderStep()}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleComplete}
              disabled={isSubmitting || !formData.marketing_goal}
              className="bg-gradient-primary text-white hover:opacity-90"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Complete Setup
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className="bg-gradient-primary text-white hover:opacity-90"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
};

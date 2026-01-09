import { Label } from "@/components/ui/label";
import { Rocket } from "lucide-react";
import { BusinessData } from "../OnboardingWizard";

const marketingGoals = [
  {
    value: "sales",
    label: "Increase Sales",
    description: "Drive more purchases and revenue",
    icon: "💰",
  },
  {
    value: "leads",
    label: "Generate Leads",
    description: "Collect inquiries and potential customers",
    icon: "📋",
  },
  {
    value: "awareness",
    label: "Brand Awareness",
    description: "Get more people to know about your brand",
    icon: "📢",
  },
  {
    value: "traffic",
    label: "Website Traffic",
    description: "Drive visitors to your website",
    icon: "🌐",
  },
  {
    value: "engagement",
    label: "Engagement",
    description: "Increase likes, comments, and shares",
    icon: "❤️",
  },
  {
    value: "app_installs",
    label: "App Installs",
    description: "Get more app downloads",
    icon: "📱",
  },
];

interface StepMarketingGoalProps {
  formData: BusinessData;
  updateFormData: (data: Partial<BusinessData>) => void;
}

export const StepMarketingGoal = ({ formData, updateFormData }: StepMarketingGoalProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Rocket className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Marketing Goal</h2>
        <p className="text-muted-foreground mt-2">
          What do you want to achieve with your ads?
        </p>
      </div>

      <div className="space-y-2">
        <Label>Select Your Primary Goal *</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {marketingGoals.map((goal) => (
            <button
              key={goal.value}
              type="button"
              onClick={() => updateFormData({ marketing_goal: goal.value })}
              className={`p-4 rounded-xl border text-left transition-all ${
                formData.marketing_goal === goal.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{goal.icon}</span>
                <div>
                  <p className="font-semibold">{goal.label}</p>
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-sm text-center">
          🎉 You're almost done! Click "Complete Setup" to start creating AI-powered ads.
        </p>
      </div>
    </div>
  );
};

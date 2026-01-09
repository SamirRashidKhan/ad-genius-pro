import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Target } from "lucide-react";
import { BusinessData } from "../OnboardingWizard";

const genderOptions = [
  { value: "all", label: "All Genders", icon: "👥" },
  { value: "male", label: "Male", icon: "👨" },
  { value: "female", label: "Female", icon: "👩" },
];

interface StepTargetAudienceProps {
  formData: BusinessData;
  updateFormData: (data: Partial<BusinessData>) => void;
}

export const StepTargetAudience = ({ formData, updateFormData }: StepTargetAudienceProps) => {
  const handleAgeChange = (values: number[]) => {
    updateFormData({
      target_age_min: values[0],
      target_age_max: values[1],
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Target Audience</h2>
        <p className="text-muted-foreground mt-2">
          Who are your ideal customers? This helps us optimize your ads.
        </p>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">Target Location</Label>
        <Input
          id="location"
          placeholder="e.g., Mumbai, Maharashtra, India"
          value={formData.target_location}
          onChange={(e) => updateFormData({ target_location: e.target.value })}
          className="h-12"
        />
        <p className="text-xs text-muted-foreground">
          Enter city, state, or country where your customers are located.
        </p>
      </div>

      {/* Age Range */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Age Range</Label>
          <span className="text-sm font-medium text-primary">
            {formData.target_age_min} - {formData.target_age_max} years
          </span>
        </div>
        <Slider
          value={[formData.target_age_min, formData.target_age_max]}
          onValueChange={handleAgeChange}
          min={13}
          max={80}
          step={1}
          className="py-4"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>13</span>
          <span>80+</span>
        </div>
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <Label>Target Gender</Label>
        <div className="grid grid-cols-3 gap-3">
          {genderOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateFormData({ target_gender: option.value })}
              className={`p-4 rounded-xl border text-center transition-all ${
                formData.target_gender === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <span className="text-2xl">{option.icon}</span>
              <p className="font-medium mt-2 text-sm">{option.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

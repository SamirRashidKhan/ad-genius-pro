import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { BusinessData } from "../OnboardingWizard";

const categories = [
  "Retail & E-commerce",
  "Food & Restaurant",
  "Fashion & Apparel",
  "Health & Wellness",
  "Beauty & Cosmetics",
  "Technology & Software",
  "Education & Training",
  "Real Estate",
  "Travel & Hospitality",
  "Automotive",
  "Finance & Insurance",
  "Entertainment & Media",
  "Sports & Fitness",
  "Home & Garden",
  "Professional Services",
  "Other",
];

interface StepBasicInfoProps {
  formData: BusinessData;
  updateFormData: (data: Partial<BusinessData>) => void;
}

export const StepBasicInfo = ({ formData, updateFormData }: StepBasicInfoProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Let's get started!</h2>
        <p className="text-muted-foreground mt-2">
          Tell us the basics about your business.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            placeholder="Your Business Name"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Business Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => updateFormData({ category: value })}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Business Description</Label>
          <Textarea
            id="description"
            placeholder="Briefly describe what your business does, your products or services..."
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            This helps our AI understand your business better for ad creation.
          </p>
        </div>
      </div>
    </div>
  );
};

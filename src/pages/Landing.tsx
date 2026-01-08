import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Video, 
  Zap, 
  Target, 
  TrendingUp, 
  Shield,
  ArrowRight,
  Play,
  Check
} from "lucide-react";

const Landing = () => {
  const features = [
    {
      icon: Video,
      title: "AI Video Ads",
      description: "Generate stunning promotional videos automatically using your business assets and AI magic."
    },
    {
      icon: Sparkles,
      title: "Smart Creatives",
      description: "AI-powered captions, hashtags, and copy that resonates with your target audience."
    },
    {
      icon: Target,
      title: "Multi-Platform Boost",
      description: "Reach customers on Instagram, Facebook, YouTube, Google Ads, and more."
    },
    {
      icon: TrendingUp,
      title: "Performance Analytics",
      description: "Track views, clicks, reach, and ROI with our comprehensive dashboard."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get your ads ready in minutes, not days. AI handles the heavy lifting."
    },
    {
      icon: Shield,
      title: "Brand Safe",
      description: "Copyright-safe music, compliant content, and professional quality guaranteed."
    }
  ];

  const pricingTiers = [
    { name: "Starter", tokens: 50, price: "₹499", popular: false },
    { name: "Pro", tokens: 200, price: "₹1,499", popular: true },
    { name: "Business", tokens: 500, price: "₹2,999", popular: false }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">AiZBoostr</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button className="bg-gradient-primary hover:opacity-90 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Powered by ZED FOUNDATION</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-foreground">Create AI-Powered</span>
              <br />
              <span className="text-gradient-primary">Video Ads in Minutes</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Transform your business with stunning AI-generated advertisements. 
              Upload your assets, let AI work its magic, and boost across all major platforms.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-white px-8 h-14 text-lg glow-primary">
                  Start Creating Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg group">
                <Play className="mr-2 w-5 h-5 group-hover:text-primary transition-colors" />
                Watch Demo
              </Button>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-success" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-success" />
                <span>Free trial included</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-success" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Preview */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="rounded-2xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm p-2 glow-primary">
              <div className="aspect-video rounded-xl bg-gradient-secondary flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                    <Play className="w-10 h-10 text-primary ml-1" />
                  </div>
                  <p className="text-muted-foreground">AI-Powered Ad Creation Dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to <span className="text-gradient-primary">Supercharge</span> Your Ads
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From AI generation to multi-platform boosting, we've got your advertising needs covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover-lift"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 relative bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How <span className="text-gradient-primary">AiZBoostr</span> Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Three simple steps to create and boost your advertisements.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: "01", title: "Upload Your Assets", desc: "Add your logo, product photos, videos, and business details." },
              { step: "02", title: "AI Creates Your Ads", desc: "Our AI generates stunning video ads with music, transitions, and captions." },
              { step: "03", title: "Boost & Track", desc: "Publish to social platforms and track performance in real-time." }
            ].map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="text-6xl font-bold text-primary/10 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 -right-4 w-8">
                    <ArrowRight className="w-8 h-8 text-primary/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, <span className="text-gradient-primary">Token-Based</span> Pricing
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Buy tokens, create ads. No subscriptions, pay only for what you use.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <div 
                key={index}
                className={`relative p-6 rounded-2xl border ${
                  tier.popular 
                    ? 'bg-gradient-primary border-transparent glow-primary' 
                    : 'bg-card border-border hover:border-primary/50'
                } transition-all duration-300`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-background rounded-full text-xs font-medium text-primary border border-primary/30">
                    Most Popular
                  </div>
                )}
                <h3 className={`text-xl font-semibold mb-2 ${tier.popular ? 'text-white' : 'text-foreground'}`}>
                  {tier.name}
                </h3>
                <div className={`text-4xl font-bold mb-1 ${tier.popular ? 'text-white' : 'text-foreground'}`}>
                  {tier.price}
                </div>
                <p className={`text-sm mb-6 ${tier.popular ? 'text-white/70' : 'text-muted-foreground'}`}>
                  {tier.tokens} tokens
                </p>
                <Link to="/auth?mode=signup">
                  <Button 
                    className={`w-full ${
                      tier.popular 
                        ? 'bg-white text-primary hover:bg-white/90' 
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-primary relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-20" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Advertising?
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of businesses already using AI to create stunning ads and boost their reach.
              </p>
              <Link to="/auth?mode=signup">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-8 h-14 text-lg">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">AiZBoostr</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Powered by ZED FOUNDATION • © 2024 All rights reserved
            </p>
            <div className="flex items-center gap-6">
              <Link to="/terms" className="text-muted-foreground hover:text-foreground text-sm">Terms</Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground text-sm">Privacy</Link>
              <Link to="/contact" className="text-muted-foreground hover:text-foreground text-sm">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

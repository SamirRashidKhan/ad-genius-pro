import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Coins,
  Plus,
  Check,
  Sparkles,
  CreditCard,
  ArrowRight,
  History,
} from "lucide-react";

interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price_inr: number;
  description: string | null;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  created_at: string;
}

const Tokens = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
      else fetchData(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchData = async (userId: string) => {
    const [tokensRes, packagesRes, transactionsRes] = await Promise.all([
      supabase.from("user_tokens").select("balance").eq("user_id", userId).single(),
      supabase.from("token_packages").select("*").eq("is_active", true).order("tokens", { ascending: true }),
      supabase.from("transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
    ]);

    if (tokensRes.data) setTokenBalance(tokensRes.data.balance);
    if (packagesRes.data) setPackages(packagesRes.data);
    if (transactionsRes.data) setTransactions(transactionsRes.data);

    setIsLoading(false);
  };

  const handlePurchase = async () => {
    if (!selectedPackage || !user) return;

    const pkg = packages.find((p) => p.id === selectedPackage);
    if (!pkg) return;

    // Here you would integrate Razorpay
    // For now, we'll show a placeholder
    toast({
      title: "Razorpay Integration",
      description: "Payment gateway will be integrated. For now, contact support to add tokens.",
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

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Tokens</h1>
          <p className="text-muted-foreground mt-1">
            Purchase tokens to create AI-powered ads.
          </p>
        </div>

        {/* Current Balance */}
        <Card className="bg-gradient-primary border-0 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Current Balance</p>
                <p className="text-4xl font-bold text-white flex items-center gap-2 mt-1">
                  <Coins className="w-8 h-8" />
                  {tokenBalance} tokens
                </p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Token Packages */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Buy Token Packages</h2>
          {packages.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No packages available. Contact support.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((pkg, index) => {
                const isPopular = index === 1;
                const isSelected = selectedPackage === pkg.id;

                return (
                  <Card
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`cursor-pointer transition-all relative ${
                      isSelected
                        ? "border-primary ring-2 ring-primary"
                        : "hover:border-primary/50"
                    } ${isPopular ? "md:-mt-4 md:mb-4" : ""}`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary rounded-full text-xs font-medium text-primary-foreground">
                        Most Popular
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">{pkg.name}</h3>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-3xl font-bold mb-1">₹{pkg.price_inr.toLocaleString()}</p>
                      <p className="text-muted-foreground text-sm mb-4">{pkg.tokens} tokens</p>
                      <p className="text-xs text-muted-foreground">
                        ₹{(pkg.price_inr / pkg.tokens).toFixed(2)} per token
                      </p>
                      {pkg.description && (
                        <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
                          {pkg.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {selectedPackage && (
            <Button
              onClick={handlePurchase}
              className="w-full mt-4 h-12 bg-gradient-primary hover:opacity-90 text-white"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Proceed to Payment
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <History className="w-5 h-5" />
            Recent Transactions
          </h2>
          <Card>
            {transactions.length === 0 ? (
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No transactions yet.</p>
              </CardContent>
            ) : (
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{tx.description || tx.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${tx.type === "credit" ? "text-green-500" : "text-foreground"}`}>
                          {tx.type === "credit" ? "+" : "-"}₹{tx.amount.toLocaleString()}
                        </p>
                        <p className={`text-xs ${tx.status === "completed" ? "text-green-500" : "text-muted-foreground"}`}>
                          {tx.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Tokens;

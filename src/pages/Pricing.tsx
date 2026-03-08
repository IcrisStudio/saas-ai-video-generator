import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Check, Coins, Zap, Shield, Star, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../convex/_generated/api";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    credits: 50,
    features: ["1 workspace only", "Flash models only", "Standard quality", "Community support"],
    limitations: ["No AI Model creation"],
    icon: Zap,
    color: "blue",
    planKey: "free",
  },
  {
    name: "Pro",
    price: "$19.99",
    credits: 500,
    features: ["Unlimited workspaces", "All premium models", "AI Model creation", "High quality", "Priority support", "Face Swap & 3D"],
    limitations: [],
    icon: Star,
    color: "emerald",
    popular: true,
    planKey: "pro",
  },
  {
    name: "Ultra",
    price: "$59.99",
    credits: 2000,
    features: ["Unlimited workspaces", "Unlimited HQ", "AI Model creation", "Ultra quality", "Dedicated support", "Early access"],
    limitations: [],
    icon: Shield,
    color: "purple",
    planKey: "ultra",
  },
];

export function Pricing() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const navigate = useNavigate();
  const dbUser = useQuery(api.users.currentUser, user ? { clerkId: user.id } : "skip") as any;

  const handleUpgrade = () => {
    if (typeof window !== "undefined" && (window as any).Clerk) {
      (window as any).Clerk.openUserProfile?.({ section: "billing" });
    } else {
      navigate("/");
    }
  };

  if (!isUserLoaded) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 px-8 pb-24 font-sans">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter">
            Choose Your Plan
          </h1>
          <p className="text-zinc-500 text-lg font-medium max-w-2xl mx-auto">
            Unlock more workspaces, AI Model creation, and premium features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = (dbUser?.plan || "free") === plan.planKey;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative rounded-[2rem] border overflow-hidden flex flex-col ${
                  plan.popular
                    ? "border-emerald-500/50 bg-emerald-500/5 shadow-xl shadow-emerald-500/10"
                    : "border-zinc-800 bg-zinc-900/50"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 py-2 bg-emerald-600 text-center text-[10px] font-black uppercase tracking-widest text-white">
                    Most Popular
                  </div>
                )}
                <div className={`p-8 flex flex-col flex-1 ${plan.popular ? "pt-14" : ""}`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        plan.color === "emerald"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : plan.color === "blue"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-purple-500/20 text-purple-400"
                      }`}
                    >
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">{plan.price}</span>
                        <span className="text-zinc-500 text-sm font-bold">/mo</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/50 mb-6">
                    <Coins className="text-amber-500 shrink-0" size={20} />
                    <div>
                      <span className="text-xl font-black text-white">{plan.credits}</span>
                      <span className="text-zinc-500 text-xs font-bold ml-2 uppercase tracking-wider">Credits/mo</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <Check size={12} strokeWidth={3} />
                        </div>
                        {f}
                      </li>
                    ))}
                    {plan.limitations.map((l) => (
                      <li key={l} className="flex items-center gap-3 text-sm text-zinc-500 font-medium">
                        <span className="w-5 h-5 shrink-0" />
                        {l}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={handleUpgrade}
                    disabled={isCurrent}
                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                      isCurrent
                        ? "bg-zinc-800 text-zinc-500 cursor-default"
                        : plan.popular
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                          : "bg-white hover:bg-zinc-200 text-black"
                    }`}
                  >
                    {isCurrent ? "Current Plan" : "Get Started"}
                    {!isCurrent && <ArrowRight size={14} />}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center space-y-4 p-8 bg-zinc-900/30 border border-zinc-800 rounded-[2rem]">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Manage Billing</h2>
          <p className="text-zinc-500 text-sm max-w-xl mx-auto">
            Update your plan, payment method, or view invoices in your account settings.
          </p>
          <button
            onClick={handleUpgrade}
            className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold text-sm transition-all"
          >
            Open Billing Settings
          </button>
        </div>
      </div>
    </div>
  );
}

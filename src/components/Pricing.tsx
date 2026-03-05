import { useState } from "react";
import { useQuery } from "convex/react";
import { useUser, PricingTable } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Check, Coins, Zap, Shield, Star, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    credits: 50,
    features: ["Flash Models Only", "Standard Quality", "Community Support"],
    icon: Zap,
    color: "blue",
    planKey: "free_user",
  },
  {
    name: "pro",
    price: "$19.99",
    credits: 500,
    features: ["All Premium Models", "High Quality", "Priority Support", "Face Swap & 3D"],
    icon: Star,
    color: "emerald",
    popular: true,
    planKey: "pro_user",
  },
  {
    name: "ultra",
    price: "$59.99",
    credits: 2000,
    features: ["Unlimited HQ", "Ultra Quality", "Dedicated Support", "Early Access"],
    icon: Shield,
    color: "purple",
    planKey: "ultra_user",
  },
];

const CREDIT_PACKS = [
  { name: "Starter Pack", credits: 100, price: "$4.99", color: "blue" },
  { name: "Creator Pack", credits: 500, price: "$19.99", color: "emerald", popular: true },
  { name: "Studio Pack", credits: 2000, price: "$69.99", color: "purple" },
];

export function Pricing() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const navigate = useNavigate();
  const dbUser = (useQuery as any)("users:currentUser", user ? { clerkId: user.id } : "skip") as any;

  const handleUpgrade = async (planKey: string) => {
    // In a real Clerk Billing setup, you might redirect to a specific checkout URL
    // or use the Clerk.openUserProfile({ section: 'billing' })
    if ((window as any).Clerk?.openUserProfile) {
      (window as any).Clerk.openUserProfile({ section: 'billing' });
    } else {
      alert("Redirecting to Clerk Billing...");
      // Fallback or specific checkout logic
    }
  };

  const handleBuyCredits = async (pack: any) => {
    alert(`Redirecting to checkout for ${pack.name}...`);
  };

  if (!isUserLoaded) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] pt-24 px-8 pb-24 font-sans">
      <div className="max-w-7xl mx-auto space-y-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-6xl font-black text-white tracking-tighter">Choose Your Plan</h1>
            <p className="text-gray-500 text-lg font-medium max-w-2xl">
              Professional AI tools for creators. Select a plan to get started.
            </p>
          </div>
        </div>

        {/* Official Plans */}
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Manage Subscription</h2>
            <p className="text-zinc-500 text-sm font-medium max-w-2xl mx-auto">
              Manage your plans and billing directly via Clerk Secure Portal.
            </p>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-2xl">
            <PricingTable />
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="space-y-12">

          <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
              {PLANS.map((plan) => (
                <div key={plan.name} className={`p-10 flex flex-col justify-between space-y-12 ${plan.popular ? 'bg-emerald-500/5' : ''}`}>
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${plan.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
                        plan.color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-purple-500/10 text-purple-500'
                        }`}>
                        <plan.icon size={28} />
                      </div>
                      {plan.popular && (
                        <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                          Popular
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-3xl font-black text-white uppercase tracking-tight">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black text-white">{plan.price}</span>
                        <span className="text-zinc-500 text-sm font-bold uppercase tracking-widest">/mo</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/50">
                      <Coins className="text-amber-500" size={20} />
                      <div className="flex flex-col">
                        <span className="text-xl font-black text-white leading-none">{plan.credits}</span>
                        <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Credits Included</span>
                      </div>
                    </div>

                    <ul className="space-y-4">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-sm text-zinc-400 font-medium">
                          <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-emerald-500 shrink-0">
                            <Check size={12} strokeWidth={3} />
                          </div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleUpgrade(plan.planKey)}
                    className={`group w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${dbUser?.planKey === plan.planKey
                      ? 'bg-zinc-800 text-zinc-400 cursor-default'
                      : plan.popular
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/20'
                        : 'bg-white hover:bg-zinc-200 text-black'
                      }`}
                  >
                    {dbUser?.planKey === plan.planKey ? 'Current Plan' : 'Get Started'}
                    {dbUser?.planKey !== plan.planKey && <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Credit Packs */}
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase">One-Time Credits</h2>
            <p className="text-zinc-500 text-lg font-medium max-w-2xl mx-auto">
              Need a quick boost? Purchase additional credits anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CREDIT_PACKS.map((pack) => (
              <motion.div
                key={pack.name}
                whileHover={{ y: -5 }}
                className={`relative bg-white/[0.02] border ${pack.popular ? 'border-amber-500/30' : 'border-white/5'} rounded-[2rem] p-8 shadow-xl flex flex-col justify-between group backdrop-blur-sm`}
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{pack.name}</h3>
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                      <Coins size={20} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-4xl font-black text-white">{pack.price}</span>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">One-time payment</p>
                  </div>
                  <div className="py-3 px-5 bg-black/20 rounded-xl border border-white/5 inline-flex items-center gap-2">
                    <span className="text-emerald-400 font-black text-lg">{pack.credits}</span>
                    <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Credits</span>
                  </div>
                </div>
                <button
                  onClick={() => handleBuyCredits(pack)}
                  className="mt-10 w-full py-4 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all border border-white/10"
                >
                  Purchase Pack
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

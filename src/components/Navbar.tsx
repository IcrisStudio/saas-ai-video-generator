import { SignInButton, SignUpButton, UserButton, useUser, useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { Sparkles, Coins } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export function Navbar() {
  const { user } = useUser();
  const { has, isLoaded: isAuthLoaded } = useAuth() as any;
  const navigate = useNavigate();
  const location = useLocation();
  const storeUser = (useMutation as any)("users:storeUser");
  const dbUser = (useQuery as any)("users:currentUser", user ? { clerkId: user.id } : "skip") as any;

  const scrollToSection = (id: string) => {
    if (location.pathname !== '/') {
      navigate(`/#${id}`);
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Navbar height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const offset = 80;
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = element.getBoundingClientRect().top;
          const elementPosition = elementRect - bodyRect;
          const offsetPosition = elementPosition - offset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.hash]);

  useEffect(() => {
    if (user && isAuthLoaded) {
      // Use official Clerk Billing detection if available, otherwise fallback to deep search
      let plan = 'free';

      if (has && typeof has === 'function') {
        if (has({ plan: 'ultra_user' })) plan = 'ultra';
        else if (has({ plan: 'pro_user' })) plan = 'pro';
      }

      // If official check didn't find anything, use our robust deep search
      const metadata = user.publicMetadata as any;
      const unsafeMetadata = user.unsafeMetadata as any;

      if (plan === 'free') {
        const deepSearchPlan = (obj: any): string | null => {
          if (!obj) return null;
          if (typeof obj === 'string') {
            const s = obj.toLowerCase();
            if (s.includes('ultra')) return 'ultra';
            if (s.includes('pro')) return 'pro';
            return null;
          }
          if (typeof obj === 'object') {
            for (const key in obj) {
              const val = obj[key];
              if (typeof val === 'string') {
                const s = val.toLowerCase();
                if (s.includes('ultra')) return 'ultra';
                if (s.includes('pro')) return 'pro';
              }
            }
            for (const key in obj) {
              const res = deepSearchPlan(obj[key]);
              if (res) return res;
            }
          }
          return null;
        };

        plan = deepSearchPlan(metadata) || deepSearchPlan(unsafeMetadata) || 'free';

        if (plan === 'free') {
          const subscriptions = (user as any).subscriptions || (user as any).organizationMemberships?.[0]?.subscriptions;
          if (Array.isArray(subscriptions)) {
            const activeSub = subscriptions.find((s: any) => s.status === 'active');
            if (activeSub) {
              const subName = String(activeSub.plan?.name || '').toLowerCase();
              if (subName.includes('ultra')) plan = 'ultra';
              else if (subName.includes('pro')) plan = 'pro';
            }
          }
        }
      }

      const rawSubDate = metadata?.subscriptionDate ||
        metadata?.updatedAt ||
        metadata?.clerk_billing?.subscription?.updated_at ||
        user.updatedAt ||
        Date.now();

      // Ensure subscriptionDate is a number (timestamp) for Convex
      const subscriptionDate = new Date(rawSubDate).getTime();

      const planKey = metadata?.plan || (plan !== 'free' ? `${plan}_user` : 'free_user');

      storeUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || undefined,
        plan,
        planKey: String(planKey),
        subscriptionDate,
      });

    }
  }, [user, isAuthLoaded, has, storeUser, navigate]);

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 z-50 px-8 flex items-center justify-between">
      <div
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => navigate('/')}
      >
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-purple-600 rounded-xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 group-hover:scale-110 transition-transform">
          <Sparkles className="text-white" size={22} />
        </div>
        <span className="text-2xl font-black tracking-tighter uppercase bg-gradient-to-r from-white via-white to-zinc-500 bg-clip-text text-transparent">
          NanoBanana Pro
        </span>
      </div>

      <div className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
        <button onClick={() => scrollToSection('features')} className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all">Features</button>
        <button onClick={() => scrollToSection('how-it-works')} className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all">How it works</button>
        <button onClick={() => scrollToSection('community')} className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all">Community</button>
        <button onClick={() => scrollToSection('pricing')} className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all">Pricing</button>
      </div>

      <div className="flex items-center gap-6">
        {user ? (
          <>
            <div className="hidden md:flex items-center gap-6 mr-2">
              <button
                onClick={() => navigate('/dashboard')}
                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${location.pathname === '/dashboard' ? 'text-emerald-400' : 'text-zinc-500 hover:text-white'
                  }`}
              >
                Go to Dashboard
              </button>
            </div>
            {dbUser && (
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-inner">
                <Coins size={14} className="text-amber-500" />
                <span className="text-xs font-mono font-black text-amber-500">
                  {dbUser.credits}
                </span>
              </div>
            )}
            <div className="p-1 bg-zinc-800 rounded-full text-white">
              <UserButton afterSignOutUrl="/" />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-6">
            <SignInButton mode="modal">
              <button className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-6 py-3 bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-xl active:scale-95">
                Join Now
              </button>
            </SignUpButton>
          </div>
        )}
      </div>
    </nav>
  );
}

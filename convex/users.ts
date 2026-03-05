import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const storeUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    plan: v.optional(v.string()),
    planKey: v.optional(v.string()),
    subscriptionDate: v.optional(v.any()), // Allow any type for robustness
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    const now = Date.now();
    // Convert subscriptionDate to number if it's a string
    let subDate = args.subscriptionDate;
    if (typeof subDate === 'string') {
      subDate = new Date(subDate).getTime();
    }

    if (user !== null) {
      // Update plan if it changed or if we need to award credits for a new subscription period
      // Also award if user is on a paid plan but has NO record of credits being awarded (recovery)
      const isNewPlan = args.plan && user.plan !== args.plan;
      const isNewSubscription = subDate && user.lastCreditAwardedAt && (subDate > user.lastCreditAwardedAt + 1000 * 60 * 60);
      const isRecoveryAward = (args.plan === 'pro' || args.plan === 'ultra') && !user.lastCreditAwardedAt;

      if (isNewPlan || isNewSubscription || isRecoveryAward) {
        let additionalCredits = 0;
        if (args.plan === 'pro') additionalCredits = 500;
        if (args.plan === 'ultra') additionalCredits = 1500;
        
        await ctx.db.patch(user._id, { 
          plan: args.plan || user.plan, 
          planKey: args.planKey || user.planKey,
          credits: user.credits + additionalCredits,
          lastCreditAwardedAt: subDate || now
        });
        return { userId: user._id, awarded: additionalCredits };
      }
      return { userId: user._id, awarded: 0 };
    }

    let initialCredits = 50; // Basic plan
    if (args.plan === 'pro') initialCredits = 500;
    if (args.plan === 'ultra') initialCredits = 1500;

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      credits: initialCredits,
      plan: args.plan || 'free',
      planKey: args.planKey,
      lastCreditAwardedAt: subDate || now
    });
    return { userId, awarded: initialCredits };
  },
});

export const syncCredits = mutation({
  args: {
    clerkId: v.string(),
    plan: v.string(),
    planKey: v.string(),
    subscriptionDate: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const now = Date.now();
    let subDate = args.subscriptionDate;
    if (typeof subDate === 'string') {
      subDate = new Date(subDate).getTime();
    }

    // Award credits if:
    // 1. Plan changed (upgrade)
    // 2. A SPECIFIC new subscription period is detected from Clerk Billing metadata
    // 3. User is on a paid plan but has NO record of credits being awarded (recovery)
    const isNewPlan = args.plan && user.plan !== args.plan;
    
    // Only trust subDate if it's explicitly from metadata (not just updatedAt fallback)
    // We'll assume if subDate is very recent (within last 10s) and we're syncing, it might be a new sub
    // But safer to only award if it's significantly newer than last award
    const isNewSubscription = subDate && user.lastCreditAwardedAt && (subDate > user.lastCreditAwardedAt + 1000 * 60 * 60); // At least 1 hour newer
    
    const isRecoveryAward = (args.plan === 'pro' || args.plan === 'ultra') && !user.lastCreditAwardedAt;

    if (isNewPlan || isNewSubscription || isRecoveryAward) {
      let additionalCredits = 0;
      if (args.plan === 'pro') additionalCredits = 500;
      if (args.plan === 'ultra') additionalCredits = 1500;

      await ctx.db.patch(user._id, {
        plan: args.plan,
        planKey: args.planKey,
        credits: user.credits + additionalCredits,
        lastCreditAwardedAt: subDate || now
      });
      return { success: true, awarded: additionalCredits };
    }

    return { success: false, message: "No new credits to award" };
  },
});

export const currentUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

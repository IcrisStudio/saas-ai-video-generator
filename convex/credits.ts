import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const deduct = mutation({
  args: { userId: v.id("users"), amount: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    if (user.credits < args.amount) throw new Error("Insufficient credits");

    await ctx.db.patch(args.userId, {
      credits: user.credits - args.amount,
    });
  },
});

export const add = mutation({
  args: { userId: v.id("users"), amount: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      credits: user.credits + args.amount,
    });
  },
});

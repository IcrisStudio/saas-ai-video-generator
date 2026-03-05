import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const saveModel = mutation({
  args: {
    name: v.string(),
    imageUrl: v.string(),
    parameters: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    return await ctx.db.insert("aiModels", {
      userId: user._id,
      name: args.name,
      imageUrl: args.imageUrl,
      parameters: args.parameters,
      createdAt: Date.now(),
    });
  },
});

export const getModels = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    return await ctx.db
      .query("aiModels")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const deleteModel = mutation({
  args: { modelId: v.id("aiModels") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const model = await ctx.db.get(args.modelId);
    if (!model || model.userId !== user._id) {
      throw new Error("Model not found or unauthorized");
    }

    await ctx.db.delete(args.modelId);
  },
});

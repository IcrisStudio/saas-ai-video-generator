import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const save = mutation({
    args: {
        userId: v.id("users"),
        type: v.string(),
        url: v.string(),
        storageId: v.optional(v.string()), // R2 URL or legacy Convex storage ID
        prompt: v.optional(v.string()),
        model: v.optional(v.string()),
        metadata: v.optional(v.any()),
        creditsToDeduct: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");
        if (user.credits < args.creditsToDeduct) throw new Error("Insufficient credits");

        const newCredits = user.credits - args.creditsToDeduct;
        await ctx.db.patch(args.userId, {
            credits: newCredits,
        });

        if (newCredits < 10 && newCredits >= 0) {
            try {
                await ctx.db.insert("notifications", {
                    userId: args.userId,
                    type: "credits_low",
                    title: "Credits running low",
                    body: `You have ${newCredits} credits left. Consider topping up.`,
                    read: false,
                    createdAt: Date.now(),
                });
            } catch (_) {}
        }

        // 2. Save generation record
        const generationId = await ctx.db.insert("generations", {
            userId: args.userId,
            type: args.type,
            url: args.url,
            storageId: args.storageId || undefined,
            prompt: args.prompt,
            model: args.model,
            usedCredits: args.creditsToDeduct,
            metadata: args.metadata,
            createdAt: Date.now(),
        });

        return generationId;
    },
});

export const list = query({
    args: { userId: v.id("users"), type: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const results = await ctx.db
            .query("generations")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();

        if (args.type) return results.filter((g) => g.type === args.type);
        return results;
    },
});


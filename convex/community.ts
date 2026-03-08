import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const publishGeneration = mutation({
  args: {
    userId: v.id("users"),
    userName: v.optional(v.string()),
    userEmail: v.string(),
    generationId: v.optional(v.id("generations")),
    type: v.string(),
    url: v.string(),
    storageId: v.optional(v.string()),
    prompt: v.optional(v.string()),
    model: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.generationId) {
      const gen = await ctx.db.get(args.generationId);
      if (!gen || gen.userId !== args.userId) throw new Error("Generation not found");
    }
    return await ctx.db.insert("communityPosts", {
      userId: args.userId,
      userName: args.userName,
      userEmail: args.userEmail,
      type: args.type,
      url: args.url,
      storageId: args.storageId,
      prompt: args.prompt,
      model: args.model,
      title: args.title,
      generationId: args.generationId,
      likes: 0,
      createdAt: Date.now(),
    });
  },
});

export const publishWorkflow = mutation({
  args: {
    userId: v.id("users"),
    userName: v.optional(v.string()),
    userEmail: v.string(),
    projectId: v.id("projects"),
    url: v.string(),
    storageId: v.optional(v.string()),
    title: v.string(),
    nodes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== args.userId) throw new Error("Project not found");
    return await ctx.db.insert("communityPosts", {
      userId: args.userId,
      userName: args.userName,
      userEmail: args.userEmail,
      type: "workflow",
      url: args.url,
      storageId: args.storageId,
      title: args.title,
      projectId: args.projectId,
      nodes: args.nodes,
      likes: 0,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {
    type: v.optional(v.string()), // "image" | "video" | "workflow" | "audio" | "text"
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = args.limit
      ? await ctx.db.query("communityPosts").order("desc").take(args.limit)
      : await ctx.db.query("communityPosts").order("desc").collect();
    if (args.type) return results.filter((p) => p.type === args.type);
    return results;
  },
});

export const like = mutation({
  args: { postId: v.id("communityPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");
    await ctx.db.patch(args.postId, { likes: post.likes + 1 });
    return post.likes + 1;
  },
});


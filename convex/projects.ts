import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Resolve URL: if value is already an R2/public URL (starts with http), return as-is; else legacy Convex storage ID. */
async function resolveStorageUrl(ctx: { storage: { getUrl: (id: any) => Promise<string | null> } }, value: string | undefined): Promise<string | null> {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return await ctx.storage.getUrl(value as any);
}

export const deleteStorageFile = mutation({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.storageId) return;
    if (args.storageId.startsWith("http://") || args.storageId.startsWith("https://")) return; // R2 URL, nothing to delete in Convex
    try {
      await ctx.storage.delete(args.storageId as any);
    } catch (e) {
      console.warn('Failed to delete storage file:', args.storageId, e);
    }
  },
});

export const uploadFile = mutation({
  args: {
    projectId: v.id("projects"),
    fileBlob: v.string(), // Base64 encoded blob
    fileName: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    
    // Return the base64 data URL directly as the storage URL
    // In production, you'd want to actually store this via Convex's file upload API
    const url = args.fileBlob; // This is already a data URL
    
    return {
      url,
      fileName: args.fileName,
    };
  },
});

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return await Promise.all(
      projects.map(async (p) => ({
        ...p,
        nodesUrl: await resolveStorageUrl(ctx, p.nodesStorageId),
        edgesUrl: await resolveStorageUrl(ctx, p.edgesStorageId),
        previewUrl: (await resolveStorageUrl(ctx, p.previewStorageId)) ?? p.previewUrl ?? null,
      }))
    );
  },
});

export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const p = await ctx.db.get(args.projectId);
    if (!p) return null;
    return {
      ...p,
      nodesUrl: await resolveStorageUrl(ctx, p.nodesStorageId),
      edgesUrl: await resolveStorageUrl(ctx, p.edgesStorageId),
      previewUrl: (await resolveStorageUrl(ctx, p.previewStorageId)) ?? p.previewUrl ?? null,
    };
  },
});

export const createProject = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    nodes: v.optional(v.string()),
    edges: v.optional(v.string()),
    nodesStorageId: v.optional(v.string()),
    edgesStorageId: v.optional(v.string()),
    previewUrl: v.optional(v.string()),
    previewStorageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("projects", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      nodes: args.nodes,
      edges: args.edges,
      nodesStorageId: args.nodesStorageId,
      edgesStorageId: args.edgesStorageId,
      previewUrl: args.previewUrl,
      previewStorageId: args.previewStorageId,
      updatedAt: Date.now(),
    });
  },
});

export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    nodes: v.optional(v.string()),
    edges: v.optional(v.string()),
    nodesStorageId: v.optional(v.string()),
    edgesStorageId: v.optional(v.string()),
    previewUrl: v.optional(v.string()),
    previewStorageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { projectId, ...rest } = args;
    // Always use patch to update existing project (never create duplicates)
    const existingProject = await ctx.db.get(projectId);
    if (!existingProject) {
      throw new Error("Project not found");
    }
    await ctx.db.patch(projectId, {
      ...rest,
      updatedAt: Date.now(),
    });
  },
});

export const saveVideo = mutation({
  args: {
    projectId: v.id("projects"),
    videoUrl: v.string(),
    videoStorageId: v.optional(v.string()),
    nodeId: v.string(),
    title: v.optional(v.string()),
    prompt: v.optional(v.string()),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    
    // Delete any existing video for this nodeId to avoid duplicates
    const existingVideos = await ctx.db
      .query("generatedVideos")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("nodeId"), args.nodeId))
      .collect();
    
    for (const video of existingVideos) {
      await ctx.db.delete(video._id);
    }
    
    return await ctx.db.insert("generatedVideos", {
      projectId: args.projectId,
      userId: project.userId,
      videoUrl: args.videoUrl,
      videoStorageId: args.videoStorageId || null,
      nodeId: args.nodeId,
      title: args.title,
      prompt: args.prompt,
      model: args.model,
      createdAt: Date.now(),
    });
  },
});

export const saveImage = mutation({
  args: {
    projectId: v.id("projects"),
    imageUrl: v.string(),
    imageStorageId: v.optional(v.string()),
    nodeId: v.string(),
    title: v.optional(v.string()),
    prompt: v.optional(v.string()),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    
    // Delete any existing image for this nodeId to avoid duplicates
    const existingImages = await ctx.db
      .query("generatedImages")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("nodeId"), args.nodeId))
      .collect();
    
    for (const image of existingImages) {
      await ctx.db.delete(image._id);
    }
    
    return await ctx.db.insert("generatedImages", {
      projectId: args.projectId,
      userId: project.userId,
      imageUrl: args.imageUrl,
      imageStorageId: args.imageStorageId || null,
      nodeId: args.nodeId,
      title: args.title,
      prompt: args.prompt,
      model: args.model,
      createdAt: Date.now(),
    });
  },
});

export const listGeneratedImages = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("generatedImages")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

export const listGeneratedVideos = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("generatedVideos")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

export const saveAiModel = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    imageUrl: v.string(),
    imageStorageId: v.optional(v.string()),
    parameters: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiModels", {
      userId: args.userId,
      name: args.name,
      imageUrl: args.imageUrl,
      imageStorageId: args.imageStorageId || null,
      parameters: args.parameters,
      createdAt: Date.now(),
    });
  },
});

export const listAiModels = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const models = await ctx.db
      .query("aiModels")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return await Promise.all(models.map(async (m) => ({
      ...m,
      resolvedUrl: (await resolveStorageUrl(ctx, m.imageStorageId)) ?? m.imageUrl,
    })));
  },
});


export const remove = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    const deleteIfConvex = async (id: string | undefined) => {
      if (!id || id.startsWith("http")) return;
      try {
        await ctx.storage.delete(id as any);
      } catch (_) {}
    };
    await deleteIfConvex(project?.previewStorageId);
    await deleteIfConvex(project?.nodesStorageId);
    await deleteIfConvex(project?.edgesStorageId);
    await ctx.db.delete(args.projectId);
  },
});

export const updatePreview = mutation({
  args: {
    projectId: v.id("projects"),
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    if (project.previewStorageId && !project.previewStorageId.startsWith("http")) {
      try {
        await ctx.storage.delete(project.previewStorageId as any);
      } catch (e) {
        console.error("Failed to delete old preview", e);
      }
    }

    await ctx.db.patch(args.projectId, {
      previewStorageId: args.storageId,
      updatedAt: Date.now(),
    });
  },
});


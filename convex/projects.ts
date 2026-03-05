import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
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
        nodesUrl: p.nodesStorageId ? await ctx.storage.getUrl(p.nodesStorageId) : null,
        edgesUrl: p.edgesStorageId ? await ctx.storage.getUrl(p.edgesStorageId) : null,
        previewUrl: p.previewStorageId ? await ctx.storage.getUrl(p.previewStorageId) : p.previewUrl,
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
      nodesUrl: p.nodesStorageId ? await ctx.storage.getUrl(p.nodesStorageId) : null,
      edgesUrl: p.edgesStorageId ? await ctx.storage.getUrl(p.edgesStorageId) : null,
      previewUrl: p.previewStorageId ? await ctx.storage.getUrl(p.previewStorageId) : p.previewUrl,
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

    // Resolve storage URLs if present
    return await Promise.all(models.map(async (m) => ({
      ...m,
      resolvedUrl: m.imageStorageId ? await ctx.storage.getUrl(m.imageStorageId) : m.imageUrl,
    })));
  },
});


export const remove = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (project?.previewStorageId) {
      await ctx.storage.delete(project.previewStorageId);
    }
    if (project?.nodesStorageId) {
      await ctx.storage.delete(project.nodesStorageId);
    }
    if (project?.edgesStorageId) {
      await ctx.storage.delete(project.edgesStorageId);
    }
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

    // Delete old preview if it exists to save space
    if (project.previewStorageId) {
      try {
        await ctx.storage.delete(project.previewStorageId);
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

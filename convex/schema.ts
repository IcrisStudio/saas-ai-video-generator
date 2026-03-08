import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Force schema sync: 2026-03-04T07:50:00
export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    credits: v.number(),
    plan: v.optional(v.string()), // e.g. "free", "pro", "ultra"
    planKey: v.optional(v.string()), // Clerk plan key
    lastCreditAwardedAt: v.optional(v.number()), // Timestamp of last credit award
    freeChatMessagesUsed: v.optional(v.number()), // Free workspace AI messages used (e.g. first 20 free)
  }).index("by_clerkId", ["clerkId"]),

  projects: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    nodes: v.optional(v.string()), // JSON stringified nodes (for small projects)
    edges: v.optional(v.string()), // JSON stringified edges (for small projects)
    nodesStorageId: v.optional(v.string()), // R2 URL or legacy Convex storage ID for node data
    edgesStorageId: v.optional(v.string()), // R2 URL or legacy Convex storage ID for edge data
    previewUrl: v.optional(v.string()), // Data URL or URL for project preview
    previewStorageId: v.optional(v.string()), // R2 URL or legacy Convex storage ID for preview
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  generatedImages: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    imageUrl: v.string(), // Original URL from API provider
    imageStorageId: v.optional(v.string()), // Storage ID for downloaded copy
    nodeId: v.string(), // Which node created this
    title: v.optional(v.string()),
    prompt: v.optional(v.string()), // The prompt used to generate it
    model: v.optional(v.string()), // Model used
    createdAt: v.number(),
  }).index("by_projectId", ["projectId"])
    .index("by_userId", ["userId"]),

  generatedVideos: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    videoUrl: v.string(), // Original URL from API provider
    videoStorageId: v.optional(v.string()), // Storage ID for downloaded copy
    nodeId: v.string(), // Which output node created this
    title: v.optional(v.string()),
    prompt: v.optional(v.string()), // The prompt used to generate it
    model: v.optional(v.string()), // Model used
    createdAt: v.number(),
  }).index("by_projectId", ["projectId"])
    .index("by_userId", ["userId"]),

  aiModels: defineTable({
    userId: v.id("users"),
    name: v.string(),
    imageUrl: v.string(),
    imageStorageId: v.optional(v.string()), // R2 URL or legacy Convex storage ID
    parameters: v.any(), // Store the JSON parameters used to generate it
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  generations: defineTable({
    userId: v.id("users"),
    type: v.string(), // "image", "video", "text", "audio"
    url: v.string(), // R2 or display URL (displayable, persistent)
    storageId: v.optional(v.string()), // R2 URL or legacy Convex storage ID
    prompt: v.optional(v.string()),
    model: v.optional(v.string()),
    name: v.optional(v.string()),
    templateName: v.optional(v.string()),
    usedCredits: v.optional(v.number()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(), // "generation_complete", "credits_low", "info"
    title: v.string(),
    body: v.optional(v.string()),
    read: v.boolean(),
    metadata: v.optional(v.any()), // e.g. { generationId, url }
    createdAt: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_userId_read", ["userId", "read"]),

  communityPosts: defineTable({
    userId: v.id("users"),
    userName: v.optional(v.string()),
    userEmail: v.string(),
    type: v.string(), // "image", "video", "workflow"
    url: v.string(),
    storageId: v.optional(v.string()), // R2 URL or legacy Convex storage ID
    title: v.optional(v.string()),
    prompt: v.optional(v.string()),
    model: v.optional(v.string()),
    projectId: v.optional(v.id("projects")), // For workflow posts
    nodes: v.optional(v.string()), // Workflow nodes summary
    metadata: v.optional(v.any()),
    generationId: v.optional(v.id("generations")),
    likes: v.number(),
    createdAt: v.number(),
  }).index("by_type", ["type"])
    .index("by_createdAt", ["createdAt"]),
});

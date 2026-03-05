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
  }).index("by_clerkId", ["clerkId"]),

  projects: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    nodes: v.optional(v.string()), // JSON stringified nodes (for small projects)
    edges: v.optional(v.string()), // JSON stringified edges (for small projects)
    nodesStorageId: v.optional(v.string()), // Storage ID for large node data
    edgesStorageId: v.optional(v.string()), // Storage ID for large edge data
    previewUrl: v.optional(v.string()), // Data URL or URL for project preview
    previewStorageId: v.optional(v.string()), // Storage ID for project preview image
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
    parameters: v.any(), // Store the JSON parameters used to generate it
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
});

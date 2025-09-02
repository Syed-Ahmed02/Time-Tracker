import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get or create user from Clerk authentication
export const getOrCreateUser = mutation({
  args: {
    clerkUserId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (existingUser) {
      // Update user information if provided
      if (args.name || args.email || args.imageUrl || args.timezone) {
        await ctx.db.patch(existingUser._id, {
          ...(args.name && { name: args.name }),
          ...(args.email && { email: args.email }),
          ...(args.imageUrl && { imageUrl: args.imageUrl }),
          ...(args.timezone && { timezone: args.timezone }),
        });
      }
      return existingUser;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      name: args.name,
      email: args.email,
      imageUrl: args.imageUrl,
      timezone: args.timezone,
    });

    return await ctx.db.get(userId);
  },
});

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
  },
});

// Get current user (returns null if not authenticated)
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null; // Return null instead of throwing error
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .first();
  },
});

// Update user information
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;

    // Verify the user exists and user has permission to update
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if current user is updating themselves
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.subject !== user.clerkUserId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(userId, updates);
    return await ctx.db.get(userId);
  },
});

// Get user's session statistics
export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const completedSessions = sessions.filter(s => s.endTime);
    const totalDuration = completedSessions.reduce((sum, session) => {
      return sum + (session.duration || 0);
    }, 0);

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      totalDuration, // in minutes
      averageSessionDuration: completedSessions.length > 0
        ? totalDuration / completedSessions.length
        : 0,
    };
  },
});

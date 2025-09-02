import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper function to convert UTC time to Dubai time (UTC+4)
function toDubaiTime(date: Date): Date {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000); // Convert to UTC
  return new Date(utc + (4 * 60 * 60 * 1000)); // Add 4 hours for Dubai time
}

// Helper function to format date in Dubai time as YYYY-MM-DD
function formatDubaiDate(date: Date): string {
  const dubaiTime = toDubaiTime(date);
  return dubaiTime.toISOString().split('T')[0];
}

// Helper function to format time in Dubai time as ISO string
function formatDubaiTime(date: Date): string {
  const dubaiTime = toDubaiTime(date);
  return dubaiTime.toISOString();
}

// Start a new work session
export const startSession = mutation({
  args: {
    userId: v.id("users"),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const date = formatDubaiDate(now); // YYYY-MM-DD format in Dubai time
    const startTime = formatDubaiTime(now); // ISO string in Dubai time

    // Check if user has an ongoing session
    const ongoingSession = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("endTime"), undefined))
      .first();

    if (ongoingSession) {
      throw new Error("User already has an ongoing session");
    }

    const sessionId = await ctx.db.insert("sessions", {
      userId: args.userId,
      date,
      startTime,
      description: args.description,
    });

    return await ctx.db.get(sessionId);
  },
});

// End a work session
export const endSession = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.endTime) {
      throw new Error("Session is already ended");
    }

    const now = new Date();
    const endTime = formatDubaiTime(now); // ISO string in Dubai time
    const startTime = new Date(session.startTime);
    const endDateTime = toDubaiTime(now);
    const duration = Math.round((endDateTime.getTime() - startTime.getTime()) / (1000 * 60)); // minutes

    await ctx.db.patch(args.sessionId, {
      endTime,
      duration,
    });

    return await ctx.db.get(args.sessionId);
  },
});

// Get user's current ongoing session
export const getCurrentSession = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("endTime"), undefined))
      .first();
  },
});

// Get user's sessions for a specific date
export const getSessionsByDate = query({
  args: {
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .collect();
  },
});

// Get user's sessions within a date range
export const getSessionsByDateRange = query({
  args: {
    userId: v.id("users"),
    startDate: v.string(), // YYYY-MM-DD format
    endDate: v.string(), // YYYY-MM-DD format
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("date"), args.startDate))
      .filter((q) => q.lte(q.field("date"), args.endDate))
      .collect();
  },
});

// Get all sessions for a user (paginated)
export const getUserSessions = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .paginate({
        numItems: limit,
        cursor: args.cursor || null,
      });
  },
});

// Update session details
export const updateSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    description: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { sessionId, ...updates } = args;

    const session = await ctx.db.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Verify user owns this session
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!user || user._id !== session.userId) {
      throw new Error("Unauthorized");
    }

    // Handle time updates - assume input times are in Dubai time
    const finalUpdates: any = { ...updates };

    if (updates.startTime) {
      const startDateTime = new Date(updates.startTime);
      finalUpdates.startTime = formatDubaiTime(startDateTime);
      // Update date based on new start time
      finalUpdates.date = formatDubaiDate(startDateTime);
    }

    if (updates.endTime) {
      const endDateTime = new Date(updates.endTime);
      finalUpdates.endTime = formatDubaiTime(endDateTime);
    }

    // Recalculate duration if times changed
    if (updates.startTime || updates.endTime) {
      const startTimeStr = finalUpdates.startTime || session.startTime;
      const endTimeStr = finalUpdates.endTime || session.endTime;

      if (startTimeStr && endTimeStr) {
        const startTime = new Date(startTimeStr);
        const endTime = new Date(endTimeStr);
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        finalUpdates.duration = duration;
      }
    }

    await ctx.db.patch(sessionId, finalUpdates);
    return await ctx.db.get(sessionId);
  },
});

// Delete a session
export const deleteSession = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Verify user owns this session
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!user || user._id !== session.userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.sessionId);
    return { success: true };
  },
});

// Create a manual session (for past time entries)
export const createManualSession = mutation({
  args: {
    userId: v.id("users"),
    startTime: v.string(), // ISO string (will be converted to Dubai time)
    endTime: v.string(), // ISO string (will be converted to Dubai time)
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, startTime: startTimeStr, endTime: endTimeStr, description } = args;

    // Parse the input times and convert to Dubai time
    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);

    const startTimeDubai = formatDubaiTime(startTime);
    const endTimeDubai = formatDubaiTime(endTime);
    const date = formatDubaiDate(startTime);

    // Calculate duration
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    const sessionId = await ctx.db.insert("sessions", {
      userId,
      date,
      startTime: startTimeDubai,
      endTime: endTimeDubai,
      duration,
      description,
    });

    return await ctx.db.get(sessionId);
  },
});

// Get session summary statistics for a user
export const getSessionSummary = query({
  args: {
    userId: v.id("users"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    if (args.startDate) {
      query = query.filter((q) => q.gte(q.field("date"), args.startDate!));
    }

    if (args.endDate) {
      query = query.filter((q) => q.lte(q.field("date"), args.endDate!));
    }

    const sessions = await query.collect();
    const completedSessions = sessions.filter(s => s.endTime && s.duration);

    const totalDuration = completedSessions.reduce((sum, session) => sum + session.duration!, 0);
    const totalSessions = sessions.length;
    const completedCount = completedSessions.length;

    return {
      totalSessions,
      completedSessions: completedCount,
      totalDuration, // in minutes
      averageDuration: completedCount > 0 ? totalDuration / completedCount : 0,
      completionRate: totalSessions > 0 ? (completedCount / totalSessions) * 100 : 0,
    };
  },
});

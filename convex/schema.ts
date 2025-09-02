import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table with Clerk ID, timezone, and metadata
  users: defineTable({
    // Clerk user ID for authentication
    clerkUserId: v.string(),
    // User's name (from Clerk metadata)
    name: v.optional(v.string()),
    // User's email (from Clerk metadata)
    email: v.optional(v.string()),
    // Local timezone (e.g., "America/New_York", "UTC", etc.)
    timezone: v.optional(v.string()),
    // User's profile image URL (from Clerk)
    imageUrl: v.optional(v.string()),
    // Timestamp when user was first created
    _creationTime: v.number(),
  })
    // Index for fast lookups by Clerk user ID
    .index("by_clerkUserId", ["clerkUserId"])
    // Index for searching users by name
    .index("by_name", ["name"]),

  // Sessions table for tracking work time
  sessions: defineTable({
    // Reference to the user who owns this session
    userId: v.id("users"),
    // Date of the session (ISO date string: YYYY-MM-DD)
    date: v.string(),
    // Start time of the session (ISO datetime string)
    startTime: v.string(),
    // End time of the session (ISO datetime string, optional for ongoing sessions)
    endTime: v.optional(v.string()),
    // Duration in minutes (calculated field, can be computed from start/end time)
    duration: v.optional(v.number()),
    // Optional description or notes for the session
    description: v.optional(v.string()),
    // Timestamp when session was created
    _creationTime: v.number(),
  })
    // Index for fast lookups by user
    .index("by_user", ["userId"])
    // Index for querying sessions by date
    .index("by_date", ["date"])
    // Compound index for user's sessions by date (most common query)
    .index("by_user_date", ["userId", "date"])
    // Index for querying by start time (for chronological ordering)
    .index("by_start_time", ["startTime"]),
});

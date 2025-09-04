import { httpRouter } from "convex/server";
import { ActionCtx, httpAction, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// HTTP action for getting last day stats for a specific user
export const getLastDayStatsHttp = httpAction(async (ctx, request) => {
  try {
    // Extract userId from URL parameters or request body
    const url = new URL(request.url);
    const userIdParam = url.searchParams.get("userId");

    if (!userIdParam) {
      return new Response(JSON.stringify({ error: "userId parameter is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Convert string to proper user ID type
    const userId = userIdParam as any; // Type assertion for Convex ID

    // Call the existing getLastDayStats query
    const stats = await ctx.runQuery(api.sessions.getLastDayStats, { userId });

    return new Response(JSON.stringify(stats), {
      headers: { "content-type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in getLastDayStatsHttp:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});

// HTTP action for getting all users' last day stats
export const getAllUsersTodayStatsHttp = httpAction(async (ctx, request) => {
  try {
    // Call the new query that gets all users' stats
    const allStats = await ctx.runQuery(api.sessions.getAllUsersTodayStats);    

    return new Response(JSON.stringify(allStats), {
      headers: { "content-type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in getAllUsersTodayStatsHttp:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});

// HTTP action for getting all users' time frame stats
export const getAllUsersTimeFrameStatsHttp = httpAction(async (ctx, request) => {
  try {
    // Extract startDate and endDate from URL parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    if (!startDate || !endDate) {
      return new Response(JSON.stringify({ 
        error: "Both startDate and endDate parameters are required (format: YYYY-MM-DD)" 
      }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return new Response(JSON.stringify({ 
        error: "Invalid date format. Use YYYY-MM-DD format (e.g., 2024-08-04)" 
      }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Validate that startDate is before or equal to endDate
    if (startDate > endDate) {
      return new Response(JSON.stringify({ 
        error: "startDate must be before or equal to endDate" 
      }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Call the new query that gets all users' stats for the time frame
    const allStats = await ctx.runQuery(api.sessions.getAllUsersTimeFrameStats, { 
      startDate, 
      endDate 
    });

    return new Response(JSON.stringify(allStats), {
      headers: { "content-type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in getAllUsersTimeFrameStatsHttp:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});

// Query for getting user by email (keeping existing functionality)
const queryByUserEmail = query({
  args: {
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail))
      .collect();
    return new Response(JSON.stringify(user), {
      headers: {
        "content-type": "application/json",
      },
      status: 200,
    });
  }
});

// Configure the HTTP router
const http = httpRouter();

// Route for getting last day stats for a specific user
http.route({
  path: "/getLastDayStats",
  method: "GET",
  handler: getLastDayStatsHttp,
});

// Route for getting all users' last day stats
http.route({
  path: "/getAllUsersLastDayStats",
  method: "GET",
  handler: getAllUsersTodayStatsHttp,
});

// Route for getting all users' time frame stats
http.route({
  path: "/getAllUsersTimeFrameStats",
  method: "GET",
  handler: getAllUsersTimeFrameStatsHttp,
});

// Export the router as default
export default http;
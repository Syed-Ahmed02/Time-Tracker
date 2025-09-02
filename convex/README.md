# Time Tracker Backend with Convex

This backend provides user management and time tracking functionality using Convex and Clerk authentication.

## Database Schema

### Users Table
- `clerkUserId`: Clerk user ID (string)
- `name`: User's full name (optional string)
- `email`: User's email address (optional string)
- `timezone`: User's local timezone (optional string) - **Note**: This is stored as a string (e.g., "America/New_York", "UTC") and is NOT converted to Dubai time
- `imageUrl`: User's profile image URL (optional string)
- `_creationTime`: Timestamp when user was created (automatically managed by Convex)

**Indexes:**
- `by_clerkUserId`: For fast lookups by Clerk ID
- `by_name`: For searching users by name

### Sessions Table
- `userId`: Reference to the user (ID reference)
- `date`: Date of the session (YYYY-MM-DD format in **Dubai time**)
- `startTime`: Start time (ISO datetime string in **Dubai time**)
- `endTime`: End time (ISO datetime string in **Dubai time**, optional for ongoing sessions)
- `duration`: Duration in minutes (optional, calculated automatically)
- `description`: Optional description/notes for the session
- `_creationTime`: Timestamp when session was created (automatically managed by Convex)

**Time Zone Notes:**
- All session dates and times are stored in **Dubai time (UTC+4)** in the database
- Times are **displayed in the user's local timezone** in the frontend
- When creating or updating sessions, times are automatically converted to Dubai time for storage
- The user's `timezone` field stores their preferred timezone (e.g., "America/New_York") and is used for display conversion
- Frontend converts Dubai time back to user's timezone for all time displays

**Indexes:**
- `by_user`: For querying all sessions for a user
- `by_date`: For querying sessions by date
- `by_user_date`: Compound index for user's sessions by date
- `by_start_time`: For chronological ordering

## API Functions

### User Management (`users.ts`)

#### `getOrCreateUser`
Creates a new user or updates existing user information from Clerk authentication.
```typescript
const user = await convex.mutation(api.users.getOrCreateUser, {
  clerkUserId: "user_123",
  name: "John Doe",
  email: "john@example.com",
  timezone: "America/New_York"
});
```

#### `getCurrentUser`
Gets the current authenticated user.
```typescript
const user = await convex.query(api.users.getCurrentUser);
```

#### `updateUser`
Updates user information.
```typescript
const updatedUser = await convex.mutation(api.users.updateUser, {
  userId: userId,
  timezone: "Europe/London"
});
```

#### `getUserStats`
Gets statistics about a user's sessions.
```typescript
const stats = await convex.query(api.users.getUserStats, { userId });
```

### Session Management (`sessions.ts`)

#### `startSession`
Starts a new work session for a user.
```typescript
const session = await convex.mutation(api.sessions.startSession, {
  userId: userId,
  description: "Working on project X"
});
```

#### `endSession`
Ends an ongoing work session.
```typescript
const endedSession = await convex.mutation(api.sessions.endSession, {
  sessionId: sessionId
});
```

#### `updateSession`
Updates session details. When updating startTime or endTime, they will be automatically converted to Dubai time.
```typescript
const updatedSession = await convex.mutation(api.sessions.updateSession, {
  sessionId: sessionId,
  description: "Updated description",
  startTime: "2024-01-15T10:00:00.000Z", // Will be converted to Dubai time for storage
  endTime: "2024-01-15T12:00:00.000Z"   // Will be converted to Dubai time for storage
});
```

#### `createManualSession`
Creates a manual session entry with custom times (useful for past time entries).
```typescript
const manualSession = await convex.mutation(api.sessions.createManualSession, {
  userId: currentUser._id,
  startTime: "2024-01-15T09:00:00.000Z", // Input time (will be converted to Dubai time)
  endTime: "2024-01-15T17:00:00.000Z",   // Input time (will be converted to Dubai time)
  description: "Manual entry for yesterday's work"
});
```

#### `getCurrentSession`
Gets the user's current ongoing session (if any).
```typescript
const currentSession = await convex.query(api.sessions.getCurrentSession, {
  userId: userId
});
```

#### `getSessionsByDate`
Gets all sessions for a user on a specific date.
```typescript
const sessions = await convex.query(api.sessions.getSessionsByDate, {
  userId: userId,
  date: "2024-01-15"
});
```

#### `getSessionsByDateRange`
Gets all sessions for a user within a date range.
```typescript
const sessions = await convex.query(api.sessions.getSessionsByDateRange, {
  userId: userId,
  startDate: "2024-01-01",
  endDate: "2024-01-31"
});
```

#### `getUserSessions`
Gets paginated sessions for a user.
```typescript
const { page, continueCursor } = await convex.query(api.sessions.getUserSessions, {
  userId: userId,
  limit: 20
});
```

#### `getSessionSummary`
Gets summary statistics for a user's sessions.
```typescript
const summary = await convex.query(api.sessions.getSessionSummary, {
  userId: userId,
  startDate: "2024-01-01",
  endDate: "2024-01-31"
});
```

## Relationships

The database follows a **one-to-many** relationship:
- **One user** can have **many sessions**
- Each session belongs to **one user** (via `userId` reference)

## Authentication

All functions that modify data include authentication checks:
- Uses Clerk's `ctx.auth.getUserIdentity()` to verify the authenticated user
- Ensures users can only modify their own data
- Sessions can only be modified by their owner

## Usage Examples

### Starting and Ending a Work Session

```typescript
// Start a new session
// Note: Times are automatically converted to Dubai time for storage
// but displayed in the user's local timezone in the UI
const session = await convex.mutation(api.sessions.startSession, {
  userId: currentUser._id,
  description: "Working on feature implementation"
});

// Later, end the session
// Note: End time is also automatically converted to Dubai time for storage
// Frontend will display times in user's timezone (e.g., if user is in New York,
// times will be shown in EST/EDT)
const endedSession = await convex.mutation(api.sessions.endSession, {
  sessionId: session._id
});
```

### Getting Today's Sessions

```typescript
const today = new Date().toISOString().split('T')[0];
const todaysSessions = await convex.query(api.sessions.getSessionsByDate, {
  userId: currentUser._id,
  date: today
});
```

### Getting Weekly Summary

```typescript
const today = new Date();
const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
const weekStart = weekAgo.toISOString().split('T')[0];
const weekEnd = today.toISOString().split('T')[0];

const weeklySummary = await convex.query(api.sessions.getSessionSummary, {
  userId: currentUser._id,
  startDate: weekStart,
  endDate: weekEnd
});
```

## Deployment

To deploy your changes:

```bash
npx convex deploy
```

This will push your schema and functions to your Convex deployment.
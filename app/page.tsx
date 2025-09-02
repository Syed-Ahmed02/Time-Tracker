"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, Calendar, User, Loader2, AlertCircle } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

// Helper function to convert Dubai time to user's local timezone
function convertDubaiTimeToUserTimezone(dubaiTimeString: string, userTimezone?: string): Date {
  const dubaiTime = new Date(dubaiTimeString)

  if (!userTimezone || userTimezone === 'UTC') {
    // If no timezone specified or UTC, convert from Dubai time to UTC
    return new Date(dubaiTime.getTime() - (4 * 60 * 60 * 1000))
  }

  // Convert Dubai time to UTC first
  const utcTime = new Date(dubaiTime.getTime() - (4 * 60 * 60 * 1000))

  // Handle common timezone offsets (basic implementation)
  const timezoneOffsets: Record<string, number> = {
    // US Timezones
    "America/New_York": -5,    // EST, EDT is -4 during daylight saving
    "America/Chicago": -6,     // CST, CDT is -5 during daylight saving
    "America/Denver": -7,      // MST, MDT is -6 during daylight saving
    "America/Los_Angeles": -8, // PST, PDT is -7 during daylight saving

    // European Timezones
    "Europe/London": 0,        // GMT, BST is +1 during daylight saving
    "Europe/Paris": 1,         // CET, CEST is +2 during daylight saving
    "Europe/Berlin": 1,        // CET, CEST is +2 during daylight saving

    // Asian Timezones
    "Asia/Dubai": 4,
    "Asia/Tokyo": 9,
    "Asia/Shanghai": 8,
    "Asia/Kolkata": 5.5,

    // Australian Timezones
    "Australia/Sydney": 10,    // AEST, AEDT is +11 during daylight saving
    "Australia/Melbourne": 10, // AEST, AEDT is +11 during daylight saving

    // Default UTC
    "UTC": 0,
  }

  const offset = timezoneOffsets[userTimezone] || 0
  return new Date(utcTime.getTime() + (offset * 60 * 60 * 1000))
}

// Helper function to format time in user's timezone
function formatTimeInUserTimezone(timeString: string, userTimezone?: string): string {
  const userTime = convertDubaiTimeToUserTimezone(timeString, userTimezone)
  return userTime.toLocaleTimeString("en-US", {
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Helper function to format date in user's timezone
function formatDateInUserTimezone(dateString: string, userTimezone?: string): string {
  const userTime = convertDubaiTimeToUserTimezone(dateString, userTimezone)
  return userTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function TimeTracker() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  const [currentTime, setCurrentTime] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [manualStartTime, setManualStartTime] = useState("")
  const [manualEndTime, setManualEndTime] = useState("")
  const [description, setDescription] = useState("")
  const [isTracking, setIsTracking] = useState(false)

  // Convex hooks - only call when user is authenticated
  const convexUser = useQuery(api.users.getCurrentUser)
  const currentSession = useQuery(
    api.sessions.getCurrentSession,
    convexUser ? { userId: convexUser._id } : "skip"
  )

  const startSessionMutation = useMutation(api.sessions.startSession)
  const endSessionMutation = useMutation(api.sessions.endSession)
  const createManualSessionMutation = useMutation(api.sessions.createManualSession)
  const createOrUpdateUserMutation = useMutation(api.users.getOrCreateUser)

  // Create or update user when Clerk user is loaded
  useEffect(() => {
    if (clerkUser && clerkLoaded && !convexUser) {
      createOrUpdateUserMutation({
        clerkUserId: clerkUser.id,
        name: clerkUser.fullName || undefined,
        email: clerkUser.primaryEmailAddress?.emailAddress || undefined,
        imageUrl: clerkUser.imageUrl || undefined,
      })
    }
  }, [clerkUser, clerkLoaded, convexUser, createOrUpdateUserMutation])

  // Update tracking state based on current session
  useEffect(() => {
    setIsTracking(!!currentSession)
    if (currentSession?.startTime) {
      setStartTime(formatTimeInUserTimezone(currentSession.startTime, convexUser?.timezone))
    }
  }, [currentSession, convexUser?.timezone])

  useEffect(() => {
    const updateTime = () => {
      // Show current time in user's local timezone
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
        }),
      )
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleClockIn = async () => {
    if (!convexUser) return

    try {
      await startSessionMutation({
        userId: convexUser._id,
        description: description || undefined,
      })
      setDescription("") // Clear description after starting
    } catch (error) {
      console.error("Error starting session:", error)
      alert("Failed to start session. Please try again.")
    }
  }

  const handleClockOut = async () => {
    if (!currentSession) return

    try {
      await endSessionMutation({
        sessionId: currentSession._id,
      })
      setStartTime("")
      setEndTime("")
    } catch (error) {
      console.error("Error ending session:", error)
      alert("Failed to end session. Please try again.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!convexUser || !manualStartTime || !manualEndTime) return

    try {
      // Create ISO datetime strings from the time inputs
      const today = new Date().toISOString().split('T')[0]; // Get today's date
      const startDateTime = new Date(`${today}T${manualStartTime}`);
      const endDateTime = new Date(`${today}T${manualEndTime}`);

      // Ensure end time is after start time
      if (endDateTime <= startDateTime) {
        alert("End time must be after start time.");
        return;
      }

      await createManualSessionMutation({
        userId: convexUser._id,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        description: description || undefined,
      });

      alert(`Manual time logged successfully!`);

      // Reset form
      setManualStartTime("")
      setManualEndTime("")
      setDescription("")
    } catch (error) {
      console.error("Error submitting manual entry:", error)
      alert("Failed to submit manual entry. Please try again.")
    }
  }

  const getTodayDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Get user's timezone display name
  const getUserTimezoneDisplay = () => {
    if (!convexUser?.timezone) return "Local Time Zone"

    // Convert common timezone identifiers to readable names
    const timezoneMap: Record<string, string> = {
      // US Timezones
      "America/New_York": "Eastern Time (ET)",
      "America/Chicago": "Central Time (CT)",
      "America/Denver": "Mountain Time (MT)",
      "America/Los_Angeles": "Pacific Time (PT)",

      // European Timezones
      "Europe/London": "Greenwich Mean Time (GMT)",
      "Europe/Paris": "Central European Time (CET)",
      "Europe/Berlin": "Central European Time (CET)",

      // Asian Timezones
      "Asia/Dubai": "Dubai Time (GST)",
      "Asia/Tokyo": "Japan Standard Time (JST)",
      "Asia/Shanghai": "China Standard Time (CST)",
      "Asia/Kolkata": "India Standard Time (IST)",

      // Australian Timezones
      "Australia/Sydney": "Australian Eastern Time (AEST)",
      "Australia/Melbourne": "Australian Eastern Time (AEST)",

      // Other
      "UTC": "Coordinated Universal Time (UTC)",
    }

    return timezoneMap[convexUser.timezone] || convexUser.timezone.replace(/_/g, ' ')
  }

  // Show loading state
  if (!clerkLoaded || !convexUser) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Time Tracker</h1>
          <h2 className="text-2xl font-bold text-foreground">Salam {convexUser?.name}</h2>
          <h2 className="text-xl font-bold text-foreground">Please Clock In or Clock Out!</h2>
          <p className="text-muted-foreground text-sm">
            {getTodayDate()} • {getUserTimezoneDisplay()}
          </p>
          <div className="flex items-center justify-center space-x-2 pt-2">
            <Clock className="h-5 w-5 text-accent" />
            <span className="text-3xl font-mono font-bold text-foreground">{currentTime}</span>
          </div>
        </div>

        {/* Quick Clock In/Out */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Quick Actions
            </CardTitle>
           
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sessionDescription" className="text-sm font-medium">
                Description (Optional)
              </Label>
              <Input
                id="sessionDescription"
                type="text"
                placeholder="What are you working on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full"
                disabled={isTracking}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleClockIn}
                disabled={isTracking}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Clock In
              </Button>
              <Button
                onClick={handleClockOut}
                disabled={!isTracking}
                variant="outline"
                className="flex-1 bg-transparent"
              >
                Clock Out
              </Button>
            </div>

            {isTracking && currentSession && (
              <div className="text-center text-sm text-accent font-medium">
                ⏱️ Currently tracking time since {startTime}
                {currentSession.description && (
                  <div className="text-xs mt-1 opacity-75">
                    "{currentSession.description}"
                  </div>
                )}
              </div>
            )}

            {isTracking && !currentSession && (
              <div className="text-center text-sm text-orange-500 font-medium flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Session starting...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Time Entry Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Manual Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description (Optional)
                </Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="What did you work on?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manualStartTime" className="text-sm font-medium">
                  Start Time
                </Label>
                <Input
                  id="manualStartTime"
                  type="time"
                  value={manualStartTime}
                  onChange={(e) => setManualStartTime(e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manualEndTime" className="text-sm font-medium">
                  End Time
                </Label>
                <Input
                  id="manualEndTime"
                  type="time"
                  value={manualEndTime}
                  onChange={(e) => setManualEndTime(e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={!manualStartTime || !manualEndTime}
              >
                Submit Manual Entry
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Status Footer */}
        <div className="text-center text-xs text-muted-foreground">
          Remote Team Time Tracker • Times shown in {getUserTimezoneDisplay()}
        </div>
      </div>
    </div>
  )
}

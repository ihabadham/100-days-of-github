"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  GitCommit,
  Github,
  Star,
  Trophy,
  Zap,
  Loader2,
} from "lucide-react";

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  public_repos: number;
  total_private_repos?: number;
  total_repos?: number;
  followers: number;
  following: number;
}

interface CommitActivity {
  date: string;
  count: number;
}

interface CalendarDay {
  date: string;
  hasCommits: boolean;
  isToday: boolean;
  dayNumber: number;
  dayOfWeek: string;
  monthDay: number;
  month: string;
  commitCount: number;
}

export default function GitHubStreakTracker() {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [commitData, setCommitData] = useState<CommitActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [todayCommits, setTodayCommits] = useState(0);

  const handleGitHubLogin = async () => {
    setLoading(true);
    try {
      // Redirect to the GitHub OAuth route
      window.location.href = "/api/auth/github";
    } catch (error) {
      console.error("Failed to initiate GitHub login:", error);
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/github/user");
      const userData = await response.json();
      setUser(userData);

      const activityResponse = await fetch("/api/github/activity");
      const activityData = await activityResponse.json();
      setCommitData(activityData);

      // Calculate streak and today's commits (using local timezone to match API)
      const today = new Date();
      const localToday = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
      );
      const todayString = localToday.toISOString().split("T")[0];

      const startDate = new Date(2025, 5, 10); // June 10th, 2025
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 99); // 100 days total (0-99)

      // Check if today falls within our challenge period
      const todayDate = new Date();
      const isInChallengePeriod =
        todayDate >= startDate && todayDate <= endDate;

      // Find today's activity only if we're in the challenge period
      const todayActivity = isInChallengePeriod
        ? activityData.find((day: CommitActivity) => day.date === todayString)
        : null;
      setTodayCommits(todayActivity?.count || 0);

      if (process.env.NODE_ENV === "development") {
        console.log(
          `Frontend: Looking for activity on ${todayString}, found: ${
            todayActivity?.count || 0
          }`
        );
      }

      // Calculate current streak - consecutive days with commits ending on the most recent commit day
      let streak = 0;
      const sortedData = activityData.sort(
        (a: CommitActivity, b: CommitActivity) =>
          new Date(b.date).getTime() - new Date(a.date).getTime() // Sort reverse chronologically
      );

      // Find the most recent day with commits and count backwards
      let foundCommitDay = false;
      for (const day of sortedData) {
        if (!foundCommitDay && day.count > 0) {
          foundCommitDay = true;
          streak = 1; // Start counting from the most recent commit day
        } else if (foundCommitDay && day.count > 0) {
          streak++; // Continue the streak
        } else if (foundCommitDay && day.count === 0) {
          break; // End of streak
        }
      }
      setCurrentStreak(streak);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is already logged in by calling the auth status endpoint
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/status");
        const data = await response.json();
        if (data.authenticated) {
          fetchUserData();
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
    };

    checkAuthStatus();

    // Check for error parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    if (error) {
      console.error(`Authentication error: ${error}`);
      // You could display an error message to the user here
    }
  }, []);

  const generateCalendarDays = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    // Start from June 10th, 2025
    const startDate = new Date(2025, 5, 10); // Month is 0-indexed, so 5 = June
    const today = new Date();

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    for (let i = 0; i < 100; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      // Use local timezone for date string to match API
      const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
      );
      const dateString = localDate.toISOString().split("T")[0];
      const activity = commitData.find((day) => day.date === dateString);
      const hasCommits = !!(activity && activity.count > 0);

      // Check if this date is today (using local timezone)
      const localToday = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
      );
      const todayString = localToday.toISOString().split("T")[0];
      const isToday = dateString === todayString;

      days.push({
        date: dateString,
        hasCommits,
        isToday,
        dayNumber: i + 1,
        dayOfWeek: dayNames[date.getDay()],
        monthDay: date.getDate(),
        month: monthNames[date.getMonth()],
        commitCount: activity?.count || 0,
      });
    }

    return days;
  };

  // Calculate progress based on the 100-day challenge period
  const challengeStartDate = new Date(2025, 5, 10); // June 10th, 2025
  const challengeEndDate = new Date(challengeStartDate);
  challengeEndDate.setDate(challengeEndDate.getDate() + 99); // 100 days total

  // Filter days that are within the challenge period and have commits
  const completedDays = commitData.filter((day) => {
    const dayDate = new Date(day.date);
    return (
      dayDate >= challengeStartDate &&
      dayDate <= challengeEndDate &&
      day.count > 0
    );
  }).length;

  const progressPercentage = (completedDays / 100) * 100;

  // Loading Screen Component
  const LoadingScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-white/20 rounded-lg w-48 animate-pulse"></div>
                  <div className="h-4 bg-white/20 rounded-lg w-32 animate-pulse"></div>
                  <div className="flex space-x-2 mt-2">
                    <div className="h-5 bg-white/20 rounded-full w-20 animate-pulse"></div>
                    <div className="h-5 bg-white/20 rounded-full w-24 animate-pulse"></div>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-8 bg-white/20 rounded-lg w-16 animate-pulse"></div>
                <div className="h-4 bg-white/20 rounded-lg w-20 animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="bg-white/10 backdrop-blur-md border-white/20"
            >
              <CardHeader className="pb-2">
                <div className="h-5 bg-white/20 rounded-lg w-32 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-white/20 rounded-lg w-20 animate-pulse mb-2"></div>
                <div className="h-2 bg-white/20 rounded-full w-full animate-pulse"></div>
                <div className="h-4 bg-white/20 rounded-lg w-36 animate-pulse mt-2"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Calendar Skeleton */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <div className="h-6 bg-white/20 rounded-lg w-80 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-3">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white/10 rounded-xl min-h-[80px] animate-pulse"
                ></div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Loading Indicator */}
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-3 text-white">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg font-medium">
              Loading your GitHub data...
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Github className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              100 Day GitHub Streak
            </CardTitle>
            <p className="text-muted-foreground">
              Track your coding journey and build an amazing streak!
            </p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGitHubLogin}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              disabled={loading}
            >
              <Github className="w-4 h-4 mr-2" />
              {loading ? "Connecting..." : "Login with GitHub"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading screen while fetching data
  if (loading || commitData.length === 0) {
    return <LoadingScreen />;
  }

  const calendarDays = generateCalendarDays();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card
          className="bg-white/10 backdrop-blur-md border-white/20 transition-all duration-300 hover:bg-white/15 hover:scale-[1.02] hover:shadow-2xl cursor-pointer group"
          onClick={() =>
            window.open(`https://github.com/${user.login}`, "_blank")
          }
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16 border-4 border-white/30 transition-all duration-300 group-hover:border-white/50 group-hover:scale-110">
                  <AvatarImage
                    src={user.avatar_url || "/placeholder.svg"}
                    alt={user.name}
                  />
                  <AvatarFallback>
                    {user.name?.charAt(0) || user.login.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="group-hover:translate-x-1 transition-transform duration-300">
                  <div className="flex items-center space-x-2">
                    <h1 className="text-2xl font-bold text-white">
                      {user.name || user.login}
                    </h1>
                    <Github className="w-5 h-5 text-white/70 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <p className="text-white/80 group-hover:text-white transition-colors duration-300">
                    @{user.login}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge
                      variant="secondary"
                      className="bg-white/20 text-white group-hover:bg-white/30 transition-colors duration-300"
                    >
                      <Star className="w-3 h-3 mr-1" />
                      {user.total_repos ||
                        user.public_repos +
                          (user.total_private_repos || 0)}{" "}
                      repos
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-white/20 text-white group-hover:bg-white/30 transition-colors duration-300"
                    >
                      {user.followers} followers
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right group-hover:translate-x-1 transition-transform duration-300">
                <div className="text-3xl font-bold text-white">
                  {currentStreak}
                </div>
                <div className="text-white/80 group-hover:text-white transition-colors duration-300">
                  day streak
                </div>
                <div className="text-xs text-white/60 group-hover:text-white/80 transition-colors duration-300 mt-1">
                  Click to view profile
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-r from-green-400 to-blue-500 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Trophy className="w-5 h-5 mr-2" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{completedDays}/100</div>
              <Progress value={progressPercentage} className="bg-white/20" />
              <p className="text-sm mt-2 text-white/90">
                {progressPercentage.toFixed(1)}% complete
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Zap className="w-5 h-5 mr-2" />
                Today's Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{todayCommits}</div>
              <p className="text-sm text-white/90">
                {(() => {
                  const today = new Date();
                  const challengeStart = new Date(2025, 5, 10);
                  const challengeEnd = new Date(challengeStart);
                  challengeEnd.setDate(challengeEnd.getDate() + 99);

                  if (today < challengeStart) {
                    return `Challenge starts ${challengeStart.toLocaleDateString()}`;
                  } else if (today > challengeEnd) {
                    return "Challenge completed! 🏆";
                  } else if (todayCommits > 0) {
                    return "Great job today! 🎉";
                  } else {
                    return "No commits yet today";
                  }
                })()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-pink-400 to-purple-500 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <GitCommit className="w-5 h-5 mr-2" />
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{currentStreak}</div>
              <p className="text-sm text-white/90">
                {currentStreak > 0
                  ? "Keep it up! 🔥"
                  : "Start your streak today!"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 100 Day Calendar */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Calendar className="w-5 h-5 mr-2" />
              100 Day Challenge Calendar (Starting June 10, 2025)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-3">
              {calendarDays.map((day) => (
                <div
                  key={day.date}
                  className={`
                    relative rounded-xl p-3 flex flex-col items-center justify-center text-xs font-medium min-h-[80px] transition-all duration-300 hover:scale-105 border-2 group
                    ${
                      day.isToday
                        ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-black border-yellow-300 shadow-lg shadow-yellow-400/50"
                        : day.hasCommits
                        ? "bg-gradient-to-br from-green-400 to-green-500 text-white border-green-300 shadow-lg shadow-green-400/30"
                        : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20"
                    }
                  `}
                >
                  {/* Styled Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                    <div className="font-semibold">
                      {day.dayOfWeek}, {day.month} {day.monthDay}
                    </div>
                    <div className="text-xs mt-1">
                      {day.commitCount === 0
                        ? "No contributions"
                        : `${day.commitCount} contribution${
                            day.commitCount !== 1 ? "s" : ""
                          }`}
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                  </div>

                  <div className="text-[10px] opacity-80 mb-1">
                    {day.dayOfWeek}
                  </div>
                  <div className="text-lg font-bold">{day.monthDay}</div>
                  <div className="text-[10px] opacity-80">{day.month}</div>
                  <div className="absolute top-1 right-1 text-[9px] opacity-60">
                    {day.dayNumber}
                  </div>
                  {day.hasCommits && (
                    <div className="absolute bottom-1 left-1 w-2 h-2 bg-white/80 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center space-x-8 mt-6 text-sm text-white/80">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-white/20 rounded-lg mr-2 border border-white/30"></div>
                <span>No commits</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-green-500 rounded-lg mr-2 border border-green-300"></div>
                <span>Commits made</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg mr-2 border border-yellow-300"></div>
                <span>Today</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

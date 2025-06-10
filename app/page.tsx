"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, GitCommit, Github, Star, Trophy, Zap } from "lucide-react";

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
}

interface CommitActivity {
  date: string;
  count: number;
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

      // Calculate streak and today's commits
      const today = new Date().toISOString().split("T")[0];
      const todayActivity = activityData.find(
        (day: CommitActivity) => day.date === today
      );
      setTodayCommits(todayActivity?.count || 0);

      // Calculate current streak
      let streak = 0;
      const sortedData = activityData.sort(
        (a: CommitActivity, b: CommitActivity) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      for (const day of sortedData) {
        if (day.count > 0) {
          streak++;
        } else {
          break;
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

  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();

    for (let i = 99; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0];
      const activity = commitData.find((day) => day.date === dateString);
      const hasCommits = activity && activity.count > 0;

      days.push({
        date: dateString,
        hasCommits,
        isToday: i === 0,
        dayNumber: 100 - i,
      });
    }

    return days;
  };

  const completedDays = commitData.filter((day) => day.count > 0).length;
  const progressPercentage = (completedDays / 100) * 100;

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

  const calendarDays = generateCalendarDays();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16 border-4 border-white/30">
                  <AvatarImage
                    src={user.avatar_url || "/placeholder.svg"}
                    alt={user.name}
                  />
                  <AvatarFallback>
                    {user.name?.charAt(0) || user.login.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {user.name || user.login}
                  </h1>
                  <p className="text-white/80">@{user.login}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge
                      variant="secondary"
                      className="bg-white/20 text-white"
                    >
                      <Star className="w-3 h-3 mr-1" />
                      {user.public_repos} repos
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-white/20 text-white"
                    >
                      {user.followers} followers
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">
                  {currentStreak}
                </div>
                <div className="text-white/80">day streak</div>
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
                {todayCommits > 0
                  ? "Great job today! 🎉"
                  : "No commits yet today"}
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
              100 Day Challenge Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-2">
              {calendarDays.map((day) => (
                <div
                  key={day.date}
                  className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium
                    ${
                      day.isToday
                        ? "bg-yellow-400 text-black ring-2 ring-yellow-300"
                        : day.hasCommits
                        ? "bg-green-400 text-white"
                        : "bg-white/20 text-white/60"
                    }
                  `}
                  title={`Day ${day.dayNumber}: ${day.date}`}
                >
                  {day.dayNumber}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center space-x-6 mt-4 text-sm text-white/80">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-white/20 rounded mr-2"></div>
                No commits
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded mr-2"></div>
                Commits made
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-400 rounded mr-2"></div>
                Today
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

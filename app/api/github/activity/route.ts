import { type NextRequest, NextResponse } from "next/server";
import { fetchWithToken } from "@/lib/github";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("github_token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Get user info first
    const userData = await fetchWithToken("https://api.github.com/user", token);
    const username = userData.login;

    if (!username) {
      throw new Error("Could not determine GitHub username");
    }

    // Get commit activity for the last 100 days
    const activityData = [];
    const today = new Date();

    // For demo purposes, we'll generate some sample data
    // In production, you would make actual API calls to GitHub
    for (let i = 0; i < 100; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0];

      // Generate random commit count (0-5) for demo
      // In production, replace with actual GitHub API data
      const commitCount = Math.floor(Math.random() * 6);

      activityData.push({
        date: dateString,
        count: commitCount,
      });
    }

    return NextResponse.json(activityData);
  } catch (error) {
    console.error("Error fetching activity data:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity data from GitHub" },
      { status: 500 }
    );
  }
}

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

  // We no longer need the client timezone offset because we rely on GitHub's
  // own contribution calendar, which is already calculated using each
  // commit's timezone.

  try {
    // Get user info first to get the username
    const userData = await fetchWithToken("https://api.github.com/user", token);
    const username = userData.login;

    if (!username) {
      throw new Error("Could not determine GitHub username");
    }

    console.log(`Fetching contribution calendar for user: ${username}`);

    // Initialize contribution data for 100 days starting from June 10th, 2025
    const activityData: { [key: string]: number } = {};
    const startDate = new Date(Date.UTC(2025, 5, 10, 0, 0, 0)); // Use explicit UTC to avoid host tz issues
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 99); // Inclusive 100-day window

    // Pre-fill activityData with zeroes
    for (let i = 0; i < 100; i++) {
      const day = new Date(startDate);
      day.setUTCDate(day.getUTCDate() + i);
      const dateString = day.toISOString().split("T")[0];
      activityData[dateString] = 0;
    }

    // Build GraphQL query to match GitHub's own contribution calendar
    const gqlQuery = `
      query ($login: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $login) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      }
    `;

    const gqlBody = {
      query: gqlQuery,
      variables: {
        login: username,
        from: startDate.toISOString(),
        to: new Date(endDate.getTime() + 24 * 60 * 60 * 1000).toISOString(), // GraphQL range is inclusive-exclusive
      },
    };

    const graphQLResponse = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify(gqlBody),
    });

    if (!graphQLResponse.ok) {
      const errorText = await graphQLResponse.text();
      console.error("GitHub GraphQL error:", errorText);
      throw new Error("Failed to fetch contribution calendar via GraphQL");
    }

    const graphQLData = await graphQLResponse.json();

    const weeks =
      graphQLData?.data?.user?.contributionsCollection?.contributionCalendar
        ?.weeks || [];

    for (const week of weeks) {
      for (const day of week.contributionDays) {
        const { date, contributionCount } = day;
        if (activityData.hasOwnProperty(date)) {
          activityData[date] = contributionCount;
        }
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        `GraphQL calendar processed; found activity on ${
          Object.keys(activityData).filter((d) => activityData[d] > 0).length
        } days`
      );
    }

    // Convert to array format for client consumption
    const result = Object.entries(activityData).map(([date, count]) => ({
      date,
      count,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching activity data:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity data from GitHub" },
      { status: 500 }
    );
  }
}

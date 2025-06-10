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
    // Get user info first to get the username
    const userData = await fetchWithToken("https://api.github.com/user", token);
    const username = userData.login;

    if (!username) {
      throw new Error("Could not determine GitHub username");
    }

    console.log(`Fetching events for user: ${username}`);

    // Initialize contribution data for 100 days starting from June 10th, 2025
    const activityData: { [key: string]: number } = {};
    const startDate = new Date(2025, 5, 10); // Month is 0-indexed, so 5 = June

    // Initialize all days with 0 contributions
    for (let i = 0; i < 100; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      // Use local timezone for date string to match event processing
      const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
      );
      const dateString = localDate.toISOString().split("T")[0];
      activityData[dateString] = 0;
    }

    // Calculate date range for filtering
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 99); // 100 days total

    if (process.env.NODE_ENV === "development") {
      console.log(
        `Fetching user events from ${startDate.toISOString()} to ${endDate.toISOString()}`
      );
    }

    // Fetch user events with pagination to extract GitHub contributions
    // Using /users/{username}/events to match GitHub's contribution graph calculation
    let page = 1;
    const eventsPerPage = 100;
    let allEvents: any[] = [];

    while (page <= 10) {
      // Limit to 10 pages (1000 events) to avoid rate limits
      try {
        const eventsData = await fetchWithToken(
          `https://api.github.com/users/${username}/events?per_page=${eventsPerPage}&page=${page}`,
          token
        );

        if (!eventsData || eventsData.length === 0) break;

        // Filter events within our date range
        const filteredEvents = eventsData.filter((event: any) => {
          const eventDate = new Date(event.created_at);
          return eventDate >= startDate && eventDate <= endDate;
        });

        allEvents = allEvents.concat(filteredEvents);

        // If we get events older than our start date, we can stop
        const oldestEventDate = new Date(
          eventsData[eventsData.length - 1].created_at
        );
        if (oldestEventDate < startDate) {
          break;
        }

        if (eventsData.length < eventsPerPage) break;
        page++;
      } catch (error) {
        console.warn(`Failed to fetch events page ${page}:`, error);
        break;
      }
    }

    console.log(`Fetched ${allEvents.length} events in date range`);

    // Process events and count contributions per day (matching GitHub's contribution graph)
    for (const event of allEvents) {
      const eventDate = new Date(event.created_at);
      // Convert to user's local timezone for date extraction
      const localEventDate = new Date(
        eventDate.getTime() - eventDate.getTimezoneOffset() * 60000
      );
      const eventDateString = localEventDate.toISOString().split("T")[0];

      const today = new Date();
      const localToday = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
      );
      const todayString = localToday.toISOString().split("T")[0];

      // Count contributions exactly like GitHub's profile page
      if (activityData.hasOwnProperty(eventDateString)) {
        switch (event.type) {
          case "PushEvent":
            // Count commits to any branch (not just main/master)
            const commitCount = event.payload?.commits?.length || 1;
            activityData[eventDateString] += commitCount;

            // Debug logging for today's activity (development only)
            if (
              process.env.NODE_ENV === "development" &&
              eventDateString === todayString
            ) {
              console.log(`🚀 PushEvent on ${eventDateString} (local time):`);
              console.log(`  - Original UTC time: ${event.created_at}`);
              console.log(`  - Local time: ${localEventDate.toISOString()}`);
              console.log(`  - Repo: ${event.repo?.name}`);
              console.log(`  - Branch: ${event.payload?.ref}`);
              console.log(`  - Commits in this push: ${commitCount}`);
              console.log(
                `  - Commit details:`,
                event.payload?.commits?.map((c: any) => ({
                  sha: c.sha?.substring(0, 7),
                  message: c.message?.substring(0, 50) + "...",
                }))
              );
              console.log(
                `  - Running total for today: ${activityData[eventDateString]}`
              );
            }
            break;
          case "IssuesEvent":
            // Only count when opening issues (not comments/closes)
            if (event.payload?.action === "opened") {
              activityData[eventDateString] += 1;
              if (
                process.env.NODE_ENV === "development" &&
                eventDateString === todayString
              ) {
                console.log(
                  `📝 Issue opened on ${eventDateString}: ${event.payload?.issue?.title}`
                );
              }
            }
            break;
          case "PullRequestEvent":
            // Only count when opening PRs (not comments/closes)
            if (event.payload?.action === "opened") {
              activityData[eventDateString] += 1;
              if (
                process.env.NODE_ENV === "development" &&
                eventDateString === todayString
              ) {
                console.log(
                  `🔀 PR opened on ${eventDateString}: ${event.payload?.pull_request?.title}`
                );
              }
            }
            break;
          case "PullRequestReviewEvent":
            // Count PR reviews submitted
            if (event.payload?.action === "submitted") {
              activityData[eventDateString] += 1;
              if (
                process.env.NODE_ENV === "development" &&
                eventDateString === todayString
              ) {
                console.log(`👀 PR review submitted on ${eventDateString}`);
              }
            }
            break;
          // GitHub doesn't count other activities as "contributions"
          default:
            if (
              process.env.NODE_ENV === "development" &&
              eventDateString === todayString
            ) {
              console.log(
                `ℹ️ Ignored event type on ${eventDateString}: ${event.type}`
              );
            }
            break;
        }
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        `📊 Final count for today (${
          new Date().toISOString().split("T")[0]
        } UTC / ${
          new Date(
            new Date().getTime() - new Date().getTimezoneOffset() * 60000
          )
            .toISOString()
            .split("T")[0]
        } local): ${
          activityData[
            new Date(
              new Date().getTime() - new Date().getTimezoneOffset() * 60000
            )
              .toISOString()
              .split("T")[0]
          ] || 0
        } contributions`
      );
    }

    // No need to round since contributions are whole numbers

    // Convert to array format
    const result = Object.entries(activityData).map(([date, count]) => ({
      date,
      count,
    }));

    console.log(
      `Processed ${allEvents.length} events, found activity on ${
        result.filter((r) => r.count > 0).length
      } days`
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching activity data:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity data from GitHub" },
      { status: 500 }
    );
  }
}

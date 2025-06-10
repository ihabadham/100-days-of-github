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

    // Get all repositories for the user with pagination
    let allRepos: any[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const reposData = await fetchWithToken(
        `https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${page}&sort=updated&type=all`,
        token
      );

      if (!reposData || reposData.length === 0) break;
      allRepos = allRepos.concat(reposData);

      if (reposData.length < perPage) break;
      page++;
    }

    // Initialize activity data for 100 days starting from June 10th, 2025
    const activityData: { [key: string]: number } = {};
    const startDate = new Date(2025, 5, 10); // Month is 0-indexed, so 5 = June

    // Initialize all days with 0 commits
    for (let i = 0; i < 100; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split("T")[0];
      activityData[dateString] = 0;
    }

    // Fetch commits for each repository with better date range and pagination
    const since = new Date(startDate);
    // Add a day buffer to account for time zone differences
    since.setDate(since.getDate() - 1);

    const until = new Date(startDate);
    until.setDate(until.getDate() + 101); // Add extra day buffer

    const sinceISOString = since.toISOString();
    const untilISOString = until.toISOString();

    console.log(
      `Fetching commits from ${sinceISOString} to ${untilISOString} for ${allRepos.length} repositories`
    );

    for (const repo of allRepos) {
      try {
        // Get commits from this repository with pagination
        let page = 1;
        const commitsPerPage = 100;

        while (true) {
          const commitsData = await fetchWithToken(
            `https://api.github.com/repos/${username}/${repo.name}/commits?since=${sinceISOString}&until=${untilISOString}&per_page=${commitsPerPage}&page=${page}`,
            token
          );

          if (!commitsData || commitsData.length === 0) break;

          // Count commits per day - check both author and committer
          for (const commit of commitsData) {
            // Check if the commit author or committer matches the username
            const isAuthor =
              commit.commit.author.email === commit.author?.email ||
              commit.author?.login === username;
            const isCommitter =
              commit.commit.committer.email === commit.committer?.email ||
              commit.committer?.login === username;

            if (isAuthor || isCommitter) {
              // Use commit author date for consistency
              const commitDate = new Date(commit.commit.author.date);
              const commitDateString = commitDate.toISOString().split("T")[0];

              // Also check the date in local time to handle timezone issues
              const localDateString = new Date(
                commitDate.getTime() - commitDate.getTimezoneOffset() * 60000
              )
                .toISOString()
                .split("T")[0];

              // Increment for both UTC and local date to handle timezone edge cases
              if (activityData.hasOwnProperty(commitDateString)) {
                activityData[commitDateString]++;
              }
              if (
                commitDateString !== localDateString &&
                activityData.hasOwnProperty(localDateString)
              ) {
                activityData[localDateString]++;
              }
            }
          }

          if (commitsData.length < commitsPerPage) break;
          page++;
        }
      } catch (repoError) {
        // If we can't access a repo (e.g., it's private and we don't have access), skip it
        console.warn(
          `Could not fetch commits for repo ${repo.name}:`,
          repoError
        );
        continue;
      }
    }

    // Convert to array format
    const result = Object.entries(activityData).map(([date, count]) => ({
      date,
      count,
    }));

    console.log(
      `Processed ${allRepos.length} repositories, found commits on ${
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

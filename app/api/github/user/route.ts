import { type NextRequest, NextResponse } from "next/server";
import { fetchWithToken } from "@/lib/github";

interface GitHubRepo {
  private: boolean;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("github_token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Get basic user data
    const userData = await fetchWithToken("https://api.github.com/user", token);

    // Get all repositories to count them accurately
    let allRepos: GitHubRepo[] = [];
    let page = 1;
    const perPage = 100; // Maximum per page

    while (true) {
      const reposResponse = await fetchWithToken(
        `https://api.github.com/user/repos?visibility=all&per_page=${perPage}&page=${page}`,
        token
      );

      if (reposResponse.length === 0) {
        break; // No more repositories
      }

      allRepos = [...allRepos, ...reposResponse];

      if (reposResponse.length < perPage) {
        break; // Last page
      }

      page++;
    }

    // Count public and private repositories
    const publicRepos = allRepos.filter((repo) => !repo.private).length;
    const privateRepos = allRepos.filter((repo) => repo.private).length;
    const totalRepos = allRepos.length;

    // Enhance user data with accurate repository counts
    const enhancedUserData = {
      ...userData,
      total_repos: totalRepos,
      public_repos: publicRepos,
      total_private_repos: privateRepos,
    };

    return NextResponse.json(enhancedUserData);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data from GitHub" },
      { status: 500 }
    );
  }
}

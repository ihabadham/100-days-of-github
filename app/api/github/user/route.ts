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
    const userData = await fetchWithToken("https://api.github.com/user", token);
    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data from GitHub" },
      { status: 500 }
    );
  }
}

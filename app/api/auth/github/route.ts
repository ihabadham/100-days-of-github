import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    console.error("Missing GITHUB_CLIENT_ID environment variable");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  // Get the base URL from the request or environment variable
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  const redirectUri = `${baseUrl}/api/auth/github/callback`;

  try {
    // Build the GitHub authorization URL with required parameters
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "user:email,repo",
      response_type: "code",
    });

    const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

    // Redirect to GitHub's authorization page
    return NextResponse.redirect(githubAuthUrl);
  } catch (error) {
    console.error("GitHub OAuth redirect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate GitHub authentication" },
      { status: 500 }
    );
  }
}

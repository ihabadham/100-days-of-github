import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    console.error("No code parameter received from GitHub");
    return NextResponse.redirect("/?error=no_code");
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Missing GitHub OAuth credentials in environment variables");
    return NextResponse.redirect("/?error=server_configuration");
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error(
        `Token exchange failed with status: ${tokenResponse.status}`
      );
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.access_token) {
      // Store token in cookie and redirect to home page
      const response = NextResponse.redirect(new URL("/", request.url));

      // Set the token in a cookie
      response.cookies.set({
        name: "github_token",
        value: tokenData.access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      return response;
    } else {
      console.error("No access token received from GitHub", tokenData);
      return NextResponse.redirect("/?error=token_exchange_failed");
    }
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    return NextResponse.redirect("/?error=oauth_failed");
  }
}

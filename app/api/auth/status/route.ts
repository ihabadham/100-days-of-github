import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("github_token")?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  // Optionally verify the token is still valid by making a request to GitHub
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (response.ok) {
      return NextResponse.json({ authenticated: true }, { status: 200 });
    } else {
      // Token is invalid, clear the cookie
      const clearResponse = NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
      clearResponse.cookies.set({
        name: "github_token",
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 0,
        path: "/",
      });
      return clearResponse;
    }
  } catch (error) {
    console.error("Error validating token:", error);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}

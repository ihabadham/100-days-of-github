import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Clear the authentication cookie
  const response = NextResponse.json({ success: true }, { status: 200 });

  response.cookies.set({
    name: "github_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });

  return response;
}

// Helper functions for GitHub API interactions

export async function fetchWithToken(url: string, token: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export function getTokenFromCookies(cookies: string) {
  const match = cookies.match(/github_token=([^;]+)/);
  return match ? match[1] : null;
}

export function getTokenFromRequest(request: Request) {
  const cookies = request.headers.get("cookie") || "";
  return getTokenFromCookies(cookies);
}

type GitHubUser = {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
};

export async function exchangeCodeForToken(code: string) {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  if (!res.ok) throw new Error("Token exchange failed");
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Missing access token");
  return data.access_token;
}

export async function ghREST<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub REST error ${res.status}: ${txt}`);
  }
  return (await res.json()) as T;
}

export async function ghGraphQL<T>(token: string, query: string, variables: any): Promise<T> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok || data.errors) {
    throw new Error(`GitHub GraphQL error: ${JSON.stringify(data.errors || data)}`);
  }
  return data.data as T;
}

export async function getViewer(token: string): Promise<GitHubUser> {
  return ghREST<GitHubUser>(token, "/user");
}

import { ghGraphQL, ghREST } from "./github";

export type WrappedData = {
  year: number;
  profile: { login: string; name?: string | null; avatarUrl?: string | null };
  totals: { commits: number; prs: number; issues: number; contributions: number };
  topRepos: Array<{ nameWithOwner: string; url: string; contributions: number }>;
  topLanguages: Array<{ name: string; bytes: number; pct: number }>;
  fun: {
    bestMonth: string;
    bestWeekday: string;
    badge: string;
  };
  generatedAt: string;
};

const QUERY = `
query Wrapped($from: DateTime!, $to: DateTime!) {
  viewer {
    login
    name
    avatarUrl
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            weekday
          }
        }
      }
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      commitContributionsByRepository(maxRepositories: 20) {
        repository { nameWithOwner url }
        contributions { totalCount }
      }
      pullRequestContributionsByRepository(maxRepositories: 20) {
        repository { nameWithOwner url }
        contributions { totalCount }
      }
      issueContributionsByRepository(maxRepositories: 20) {
        repository { nameWithOwner url }
        contributions { totalCount }
      }
    }
  }
}
`;

function monthName(isoDate: string) {
  const d = new Date(isoDate);
  return d.toLocaleString("en-US", { month: "long" });
}

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function generateWrapped(token: string, year: number): Promise<WrappedData> {
  const from = new Date(`${year}-01-01T00:00:00Z`).toISOString();
  const to = new Date(`${year}-12-31T23:59:59Z`).toISOString();

  type GQL = {
    viewer: {
      login: string;
      name: string | null;
      avatarUrl: string;
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: Array<{
            contributionDays: Array<{
              date: string;
              contributionCount: number;
              weekday: number; // 0..6
            }>;
          }>;
        };
        totalCommitContributions: number;
        totalPullRequestContributions: number;
        totalIssueContributions: number;
        commitContributionsByRepository: Array<{
          repository: { nameWithOwner: string; url: string };
          contributions: { totalCount: number };
        }>;
        pullRequestContributionsByRepository: Array<{
          repository: { nameWithOwner: string; url: string };
          contributions: { totalCount: number };
        }>;
        issueContributionsByRepository: Array<{
          repository: { nameWithOwner: string; url: string };
          contributions: { totalCount: number };
        }>;
      };
    };
  };

  const data = await ghGraphQL<GQL>(token, QUERY, { from, to });
  const cc = data.viewer.contributionsCollection;

  // Merge repo contributions across commits/prs/issues
  const repoMap = new Map<string, { nameWithOwner: string; url: string; contributions: number }>();

  function addRepo(arr: any[]) {
    for (const item of arr) {
      const key = item.repository.nameWithOwner;
      const prev = repoMap.get(key);
      const add = item.contributions.totalCount as number;
      if (prev) prev.contributions += add;
      else repoMap.set(key, { nameWithOwner: key, url: item.repository.url, contributions: add });
    }
  }

  addRepo(cc.commitContributionsByRepository);
  addRepo(cc.pullRequestContributionsByRepository);
  addRepo(cc.issueContributionsByRepository);

  const topRepos = [...repoMap.values()]
    .sort((a, b) => b.contributions - a.contributions)
    .slice(0, 8);

  // Languages: REST /repos/{owner}/{repo}/languages for top repos
  const langBytes = new Map<string, number>();
  for (const repo of topRepos) {
    const [owner, name] = repo.nameWithOwner.split("/");
    type LangRes = Record<string, number>;
    const langs = await ghREST<LangRes>(token, `/repos/${owner}/${name}/languages`);
    for (const [lang, bytes] of Object.entries(langs)) {
      langBytes.set(lang, (langBytes.get(lang) || 0) + bytes);
    }
  }

  const totalLangBytes = [...langBytes.values()].reduce((a, b) => a + b, 0) || 1;
  const topLanguages = [...langBytes.entries()]
    .map(([name, bytes]) => ({ name, bytes, pct: (bytes / totalLangBytes) * 100 }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 6);

  // Best month + weekday from calendar days
  const monthTotals = new Map<string, number>();
  const weekdayTotals = new Map<number, number>();

  for (const week of cc.contributionCalendar.weeks) {
    for (const day of week.contributionDays) {
      const m = monthName(day.date);
      monthTotals.set(m, (monthTotals.get(m) || 0) + day.contributionCount);
      weekdayTotals.set(day.weekday, (weekdayTotals.get(day.weekday) || 0) + day.contributionCount);
    }
  }

  const bestMonth =
    [...monthTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "January";
  const bestWeekdayIdx =
    [...weekdayTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 1;

  // Fun badge
  const commits = cc.totalCommitContributions;
  const prs = cc.totalPullRequestContributions;
  const issues = cc.totalIssueContributions;

  let badge = "Balanced Builder";
  if (prs > commits && prs > issues) badge = "PR Machine";
  else if (commits > prs && commits > issues) badge = "Commit Captain";
  else if (issues > prs && issues > commits) badge = "Issue Hunter";

  return {
    year,
    profile: {
      login: data.viewer.login,
      name: data.viewer.name,
      avatarUrl: data.viewer.avatarUrl,
    },
    totals: {
      commits,
      prs,
      issues,
      contributions: cc.contributionCalendar.totalContributions,
    },
    topRepos,
    topLanguages,
    fun: {
      bestMonth,
      bestWeekday: weekdayNames[bestWeekdayIdx],
      badge,
    },
    generatedAt: new Date().toISOString(),
  };
}

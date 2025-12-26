import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateWrapped } from "@/lib/wrapped";

/**
 * Fetch the number of distinct days in the year where contributionCount > 0
 * using GitHub GraphQL contributionCalendar.
 */
async function fetchActiveDays(accessToken: string, year: number): Promise<number> {
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;

  const query = `
    query($from: DateTime!, $to: DateTime!) {
      viewer {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: { from, to } }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json || json.errors) {
    // We don't hard-fail generation if this extra call fails
    console.error("ACTIVE_DAYS_GRAPHQL_ERROR:", res.status, json?.errors ?? json);
    return 0;
  }

  const weeks =
    json?.data?.viewer?.contributionsCollection?.contributionCalendar?.weeks ?? [];

  let activeDays = 0;
  for (const w of weeks) {
    const days = w?.contributionDays ?? [];
    for (const d of days) {
      if ((d?.contributionCount ?? 0) > 0) activeDays += 1;
    }
  }

  return activeDays;
}

function safeNum(v: any, fallback = 0) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      year?: number;
      isPublic?: boolean;
    };

    const year = body.year ?? new Date().getFullYear();
    const isPublic = body.isPublic ?? true;

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // Your existing generator (commits/top repos/top languages/etc.)
    const data: any = await generateWrapped(user.accessToken, year);

    // ✅ Patch missing "activeDays" (and repoCount) into totals
    // 1) Get activeDays from GitHub calendar
    const activeDays = await fetchActiveDays(user.accessToken, year);

    // 2) Repo count: best effort — use distinct repos we already have
    //    (If you later track all "touched repos", swap this to that list length.)
    const repoCount =
      Array.isArray(data?.topRepos) ? new Set(data.topRepos.map((r: any) => r?.nameWithOwner ?? r?.name)).size : 0;

    // Ensure totals exists
    data.totals = data.totals ?? {};

    // Only set if missing / blank
    if (data.totals.activeDays == null || data.totals.activeDays === 0) {
      data.totals.activeDays = activeDays;
    }
    if (data.totals.repoCount == null || data.totals.repoCount === 0) {
      data.totals.repoCount = repoCount;
    }

    // Also normalize contributions numbers if needed (keeps UI stable)
    data.totals.contributions = safeNum(data?.totals?.contributions, safeNum(data?.totals?.commits, 0));

    // Upsert wrapped
    const wrapped = await prisma.wrapped.upsert({
      where: { userId_year: { userId: user.id, year } },
      update: { data, isPublic },
      create: { userId: user.id, year, data, isPublic },
    });

    return NextResponse.json({ id: wrapped.id });
  } catch (err: any) {
    console.error("WRAPPED_GENERATE_ERROR:", err);
    return NextResponse.json(
      { error: "generate_failed", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { exchangeCodeForToken, getViewer } from "@/lib/github";
import { prisma } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(`${process.env.APP_URL}/?error=missing_code`);

  try {
    const token = await exchangeCodeForToken(code);
    const viewer = await getViewer(token);

    const user = await prisma.user.upsert({
      where: { githubId: viewer.id },
      update: {
        login: viewer.login,
        name: viewer.name,
        avatarUrl: viewer.avatar_url,
        accessToken: token,
      },
      create: {
        githubId: viewer.id,
        login: viewer.login,
        name: viewer.name,
        avatarUrl: viewer.avatar_url,
        accessToken: token,
      },
    });

    await setSessionCookie({ userId: user.id });
    return NextResponse.redirect(`${process.env.APP_URL}/dashboard`);
  } catch (e) {
    return NextResponse.redirect(`${process.env.APP_URL}/?error=auth_failed`);
  }
}

import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl w-full space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">GitHub Wrapped</h1>
        <p className="text-zinc-400">
          Your year in code — contributions, top repos, languages, and a shareable recap.
        </p>

        <a
          href="/api/auth/login"
          className="inline-flex items-center justify-center rounded-xl bg-white text-black px-5 py-3 font-semibold hover:opacity-90 transition"
        >
          Login with GitHub
        </a>

        <div className="text-sm text-zinc-500">
          Built with Next.js + GitHub OAuth + GraphQL.
        </div>
      </div>
    </main>
  );
}

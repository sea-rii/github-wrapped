"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function generate() {
  setLoading(true);
  try {
    const res = await fetch("/api/wrapped/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, isPublic: true }),
    });

    const text = await res.text(); // read body even on error

    if (!res.ok) {
      console.error("Generate failed:", res.status, text);
      alert(`Generate failed: ${res.status}\n${text}`);
      return;
    }

    const data = JSON.parse(text) as { id: string };
    router.push(`/w/${data.id}`);
  } finally {
    setLoading(false);
  }
}


  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button onClick={logout} className="text-sm text-zinc-400 hover:text-white">
            Logout
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-800 p-6 space-y-4">
          <label className="block text-sm text-zinc-400">Pick a year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3"
          />

          <button
            onClick={generate}
            disabled={loading}
            className="w-full rounded-xl bg-white text-black px-5 py-3 font-semibold hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate Wrapped"}
          </button>
        </div>

        <p className="text-sm text-zinc-500">
          Tip: first time generation may take a bit (languages are fetched repo-by-repo).
        </p>
      </div>
    </main>
  );
}

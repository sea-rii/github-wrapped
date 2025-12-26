# GitHub Wrapped 🎁

A cinematic, shareable **GitHub Wrapped experience** that turns your yearly GitHub activity into a beautiful, story-driven recap — inspired by Spotify Wrapped.

Built with **Next.js 14**, **TypeScript**, **Prisma**, and **GitHub OAuth**.

---

## ✨ Features

- 🔐 **GitHub OAuth login**
- 📊 Yearly GitHub activity summary
- 🧮 Total contributions, commits, PRs, issues
- 📦 Top repositories by contribution count
- 🗣️ Top programming languages (with percentages)
- 🔥 Best month & most active weekday
- 🏆 Fun “developer vibe” badge (e.g. *Commit Captain*)
- 🎞️ Slide-based wrapped experience (click to navigate)
- 📄 Final **all-in-one summary page** for sharing
- 🔗 Shareable public wrapped links
- ⬇️ Downloadable summary image
- 🗄️ Persistent storage using PostgreSQL + Prisma

---

## 🧠 How it works (High level)

1. User logs in with GitHub OAuth
2. App fetches GitHub activity using GitHub API
3. Data is processed into a yearly “wrapped” object
4. Wrapped data is saved in the database
5. User views the wrapped as a slide-based story
6. Final summary page allows sharing/downloading

---

## 🧱 Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Next.js API routes
- **Auth:** GitHub OAuth
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Deployment:** Vercel (recommended)

---

## 📁 Project Structure

github-wrapped/
├── prisma/
│ ├── schema.prisma
│ └── migrations/
├── public/
├── src/
│ ├── app/
│ │ ├── api/
│ │ │ ├── auth/
│ │ │ ├── wrapped/
│ │ │ │ ├── generate/
│ │ │ │ └── [id]/
│ │ ├── w/
│ │ │ └── [id]/
│ │ └── page.tsx
│ ├── lib/
│ │ ├── auth.ts
│ │ ├── db.ts
│ │ └── wrapped.ts
│ └── components/
├── .env.example
├── package.json
└── README.md

---

## 🔑 Setting up GitHub OAuth

1. Go to GitHub → Settings → Developer settings → OAuth Apps

2. Create a new OAuth App

3. Set:

   - Homepage URL: http://localhost:3000

   - Authorization callback URL:

        http://localhost:3000/api/auth/callback/github


4. Copy Client ID & Client Secret

5. Add them to .env.local

--

## 🗄️ Database Setup (Prisma)

1.  Install dependencies
> npm install
2.  Generate Prisma client
> npx prisma generate
3.  Run migrations
> npx prisma migrate dev

--

## ▶️ Running the App Locally

> npm run dev

Then open:

> http://localhost:3000

After login, generate your wrapped and view it instantly.

--

## 🙌 Credits

Built with ❤️ by Sai Siri Chittineni

If this inspired you, ⭐ the repo!

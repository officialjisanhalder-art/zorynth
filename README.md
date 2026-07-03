# 🎬 Zorynth — Cyberpunk VOD Streaming Platform

A full-stack video-on-demand streaming platform built with React, Vite, Supabase, and Tailwind CSS — featuring a dual-application architecture with a consumer streaming app and a separate admin control panel.

---

## 🏗️ Architecture

| App | Port | Purpose |
|-----|------|---------|
| **Consumer App** (`/`) | `5173` | Streaming, profiles, browse, watchlist, ratings |
| **Admin Panel** (`/admin-app`) | `5174` | User management, CMS catalog editor, analytics |

Both apps share the same **Supabase** database backend.

---

## ✨ Features

### Consumer App (Port 5173)
- 🔐 Supabase Auth — Sign up / Sign in / Google OAuth
- 👤 Multi sub-profile management per account
- 🎬 Browse catalog — filter by Movies / TV Shows / Category
- 🔍 Real-time search
- ❤️ Watchlist (add/remove)
- ⭐ Ratings & Reviews
- ▶️ Video player with watch progress tracking
- 🚫 Automatic session kick on admin ban

### Admin Panel (Port 5174)
- 🔒 Role-gated login (admin accounts only)
- 📊 Platform analytics dashboard (streams, users, uptime)
- 👥 User directory — toggle roles, ban/unban accounts
- 🎥 CMS catalog editor — add, edit, delete, publish/unpublish media titles
- 🔄 Real-time sync with consumer app

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/zorynth.git
cd zorynth
```

### 2. Set up environment variables

**Consumer App:**
```bash
cp .env.example .env
# Fill in your Supabase URL and Anon Key
```

**Admin App:**
```bash
cp admin-app/.env.example admin-app/.env
# Fill in your Supabase URL, Anon Key, and Service Role Key
```

### 3. Install dependencies
```bash
# Consumer app
npm install

# Admin app
cd admin-app && npm install
```

### 4. Set up the Supabase database
- Go to your [Supabase SQL Editor](https://supabase.com/dashboard)
- Run the migration script: `supabase/migrations/20260703000000_zorynth_schema.sql`

### 5. Run both dev servers
```bash
# Terminal 1 — Consumer App
npm run dev        # http://localhost:5173

# Terminal 2 — Admin Panel
cd admin-app
npm run dev        # http://localhost:5174
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| State Management | Zustand |
| Backend / Auth / DB | Supabase (PostgreSQL + Auth + RLS) |
| Icons | Lucide React |
| Routing | React Router v7 |

---

## 📁 Project Structure

```
zorynth/
├── src/                    # Consumer App source
│   ├── pages/              # Browse, Player, Profiles, Login, Register
│   ├── layouts/            # MainLayout, AuthLayout
│   ├── stores/             # Zustand auth + profile stores
│   └── lib/                # Supabase client
├── admin-app/              # Separate Admin App
│   └── src/
│       ├── pages/          # Dashboard, Content CMS, Login
│       ├── layouts/        # AdminLayout (sidebar)
│       ├── stores/         # Admin auth store
│       └── lib/            # Supabase admin client (service role)
└── supabase/
    └── migrations/         # Database schema SQL scripts
```

---

## 🔐 Security Notes

- `.env` files are **git-ignored** — never commit your Supabase keys
- Admin panel uses the **service role key** (server-side only context)
- Row Level Security (RLS) is enabled on all tables
- Users can only access their own data; admins bypass via service role

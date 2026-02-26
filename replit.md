# The Meridian — replit.md

## Overview

The Meridian is a neutral news aggregation platform (themeridian.news) that ingests articles from 88 news sources across the political spectrum and multiple global regions, clusters them by story using AI, and produces neutral fact-first summaries. It shows where sources agree and diverge, displays editorial lean indicators (bias ratings), and lets users understand coverage patterns without toggling between multiple news sites.

The core pipeline runs every 30 minutes: RSS ingestion → article clustering → LLM-powered neutral summarization → publication. Key features include consensus scoring, narrative lens analysis, coverage gap detection, divergence summaries, search, bookmarks, trending stories, source comparison, related stories, reading time estimates, email digests, and browser push notifications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure

The project uses a three-folder monorepo pattern:

- **`client/`** — React SPA (Vite + TypeScript)
- **`server/`** — Express API server (TypeScript via tsx)
- **`shared/`** — Shared types, schemas, and API route definitions used by both client and server

Path aliases: `@/` → `client/src/`, `@shared/` → `shared/`, `@assets/` → `attached_assets/`

### Frontend Architecture

- **React** with **TypeScript**, bundled by **Vite**
- **Wouter** for client-side routing (lightweight alternative to React Router)
- **TanStack React Query** for server state management and data fetching
- **Tailwind CSS** with CSS variables for theming (warm editorial design with Inter/Lora fonts)
- **shadcn/ui** (new-york style) for component library, built on Radix UI primitives
- **Framer Motion** for page transitions and animations
- **date-fns** for date formatting

Pages: Landing (`/`), Feed (`/feed`), Conflict Map (`/conflicts`), Story Detail (`/story/:id`), Saved Stories (`/saved`), Methodology (`/methodology`), Admin (`/admin`), Sources Index (`/sources`), Privacy Policy (`/privacy`), Terms of Service (`/terms`), Contact Us (`/contact`), About (`/about`), Reset Password (`/auth/reset-password`)

Custom components: `StoryCard` (with bookmark button, reading time), `BiasBadge`, `Navbar` (with search, notifications, bookmarks), `Footer`, `ScrollToTop`, `StockTicker`, `EditionSelector`

### Backend Architecture

- **Express** server running on Node.js with TypeScript (compiled via tsx in dev, esbuild for production)
- **HTTP server** created manually via `createServer` to support potential WebSocket upgrades
- API routes prefixed with `/api/`
- The server serves the Vite-built static files in production via `server/static.ts`
- In development, Vite dev server middleware is injected via `server/vite.ts`

### Database

- **PostgreSQL** database (required — uses `DATABASE_URL` environment variable)
- **Drizzle ORM** for schema definition and queries
- **drizzle-zod** for generating Zod validation schemas from Drizzle tables
- Schema lives in `shared/schema.ts` and `shared/models/`
- Push migrations via `drizzle-kit push` (no migration files approach)

Key tables:
- `sources` — News sources with bias ratings (left/center-left/center/center-right/right), RSS URLs
- `articles` — Individual articles from sources
- `stories` — Clustered, neutralized story summaries with key facts, divergence summaries, consensus scores, narrative lens, coverage gaps
- `story_articles` — Many-to-many relationship between stories and articles
- `bookmarks` — User bookmarks (userId + storyId FK to stories)
- `sessions` — Express session storage
- `users` — User accounts with email/password auth
- `password_reset_tokens` — Token-based password reset flow
- `conversations` / `messages` — Chat storage for AI integrations

### Authentication

- **Custom email/password auth** with bcrypt password hashing
- **OAuth social login** for Google, Facebook, Apple, GitHub, and Microsoft via Passport.js
- Session-based with `express-session` and `connect-pg-simple` for PostgreSQL session storage
- Auth routes: POST `/api/auth/register`, POST `/api/auth/login`, POST `/api/auth/logout`, GET `/api/auth/user`, POST `/api/auth/forgot-password`, POST `/api/auth/reset-password`, PATCH `/api/auth/preferences`
- OAuth routes: GET `/api/auth/{google,facebook,github,microsoft,apple}` (initiate), GET `/api/auth/{provider}/callback` (callback)
- GET `/api/auth/providers` — returns list of configured OAuth providers (based on env vars)
- Client-side: `useAuth()` hook wrapping React Query, `AuthModal` component (sign in/sign up/forgot password + OAuth buttons), `OnboardingModal` component (topic preferences + digest frequency)
- OAuth implementation: `server/replit_integrations/auth/oauth.ts` — Passport strategies for Google/Facebook/GitHub, manual OAuth2 flows for Microsoft (Azure AD) and Apple
- Account linking: If OAuth email matches existing account, accounts are linked automatically
- Users table has `oauthProviderId` column for storing provider-specific user IDs
- Password reset flow: token-based, tokens stored in `password_reset_tokens` table, 1-hour expiry
- Post-signup onboarding: auto-opens after first sign up to collect topic preferences and digest frequency
- User preferences: `topicPreferences` (text array), `digestFrequency` (daily/weekly/none), `onboardingCompleted` (boolean)

OAuth environment variables (set to enable each provider):
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — Google OAuth 2.0
- `FACEBOOK_APP_ID` + `FACEBOOK_APP_SECRET` — Facebook Login
- `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` — GitHub OAuth
- `MICROSOFT_CLIENT_ID` + `MICROSOFT_CLIENT_SECRET` — Microsoft (Azure AD)
- `APPLE_CLIENT_ID` + `APPLE_CLIENT_SECRET` — Apple Sign In

### Search, Bookmarks & Discovery

- **Search**: GET `/api/stories/search?q=keyword` — ILIKE search on headline and summary, debounced 300ms in Navbar search bar
- **Bookmarks**: GET/POST/DELETE `/api/bookmarks/:storyId` — authenticated users can save stories, view on `/saved` page
- **Trending**: GET `/api/stories/trending` — stories with most source coverage, displayed as scrollable banner on Feed page
- **Related Stories**: GET `/api/stories/:id/related` — same-topic stories shown at bottom of StoryPage
- **Reading Time**: Calculated client-side (word count / 200 wpm, min 1 min), shown on StoryCard and StoryPage
- **Share Buttons**: X/Twitter, Facebook, LinkedIn, Copy Link on StoryPage
- **Source Comparison**: Side-by-side view of 2-3 sources' framing, tone, emphasis, omissions on StoryPage
- **Email Digest**: POST `/api/digest/send-test` — sends branded HTML email with top 5 trending stories via Gmail (GMAIL_APP_PASSWORD)
- **Browser Notifications**: Notification bell in Navbar, request browser permission, localStorage-persisted state

### News Pipeline (`server/pipeline.ts`)

- RSS feeds parsed with `rss-parser`
- Articles fetched from active sources, filtered to last 48 hours
- **OpenAI API** (via Replit AI Integrations) used for:
  - Clustering articles into stories by semantic similarity
  - Generating neutral summaries, key facts, divergence analysis
  - Consensus scoring, narrative lens analysis, coverage gap detection
- Pipeline can be triggered manually via admin page or runs on auto-refresh interval

### Contact Form

- POST `/api/contact` saves submissions to `contact_submissions` table in the database
- GET `/api/contact/submissions` fetches all submissions (viewable in admin dashboard)
- PATCH `/api/contact/submissions/:id/read` marks a submission as read
- Admin dashboard shows all submissions with unread count badge, mark-as-read functionality
- Subject categories: General Inquiry, Privacy/Data Request, Feedback, Bug Report, Press & Partnerships

### API Contract Pattern

- `shared/routes.ts` defines all API routes with Zod schemas for inputs and responses
- Both client and server import from this shared module for type safety
- Client hooks (`use-stories.ts`, `use-sources.ts`) validate responses with `safeParse`

### Privacy & Cookie Consent

- Cookie consent banner appears on first visit (1s delay), stored in localStorage
- Three cookie categories: Essential (always on), Functional (toggle), Analytics (toggle, off by default)
- `CookieBanner` component renders at app level in `App.tsx`
- `CookiePreferencesModal` accessible from: banner "Manage" button, footer "Manage Cookies" link, Privacy Policy page inline link
- Preferences stored in localStorage keys: `meridian_cookie_consent` (boolean), `meridian_cookie_preferences` (JSON)
- Component: `client/src/components/CookieConsent.tsx` exports `CookieBanner`, `CookiePreferencesModal`, `useCookiePreferences`
- Privacy Policy page updated with dedicated Cookies & Tracking section (section 6)

### Edition & Location

- Stories have a `region` field (us, uk, canada, europe, international) assigned by AI during pipeline clustering
- Edition selector in navbar subbar lets users pick their edition (stored in localStorage)
- "Set Location" modal allows entering city/region or using browser geolocation (OpenStreetMap Nominatim reverse geocoding)
- Feed page filters stories by the selected edition
- Component: `client/src/components/EditionSelector.tsx` exports `EditionSelector` component and `useEdition()` hook

### Build System

- **Development**: `tsx server/index.ts` with Vite dev middleware for HMR
- **Production build**: Custom `script/build.ts` that runs Vite build for client, esbuild for server
- Server output: `dist/index.cjs`; Client output: `dist/public/`
- Production start: `node dist/index.cjs`

### Replit Integrations

Located in `server/replit_integrations/` and `client/replit_integrations/`:
- **Auth** — Replit OIDC authentication
- **Chat** — Conversation/message storage and OpenAI chat routes
- **Audio** — Voice recording, playback, and streaming (WebM/Opus, PCM16)
- **Image** — Image generation via `gpt-image-1`
- **Batch** — Rate-limited batch processing with retries for LLM calls

## External Dependencies

### Required Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (mandatory)
- `SESSION_SECRET` — Express session secret (mandatory for auth)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key via Replit AI Integrations
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI base URL via Replit AI Integrations
- `ESRI_API_KEY` — Esri ArcGIS API key for conflict map basemaps
- `GMAIL_APP_PASSWORD` — Gmail app password for sending email digests

### Key Third-Party Services
- **PostgreSQL** — Primary database (must be provisioned)
- **OpenAI API** (via Replit AI Integrations) — Powers the neutrality engine, article clustering, summarization
- **RSS Feeds** — 15+ news source feeds ingested via `rss-parser`
- **GitHub** (optional) — Push-to-GitHub script using `@octokit/rest`

### Major NPM Packages
- Server: `express`, `drizzle-orm`, `pg`, `openai`, `rss-parser`, `passport`, `express-session`, `connect-pg-simple`
- Client: `react`, `wouter`, `@tanstack/react-query`, `framer-motion`, `date-fns`, `tailwindcss`, shadcn/ui components (Radix UI), `three`, `@react-three/fiber` (v8), `@react-three/drei` (v9) for 3D globe visualization
- Shared: `zod`, `drizzle-zod`
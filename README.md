<p align="center">
  <h1 align="center">The Meridian</h1>
  <p align="center">
    <strong>AI-powered neutral news aggregation across the political spectrum</strong>
  </p>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js"></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="#"><img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React"></a>
  <a href="#"><img src="https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white" alt="Express"></a>
  <a href="#"><img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL"></a>
  <a href="#"><img src="https://img.shields.io/badge/Drizzle_ORM-latest-C5F74F?style=flat-square&logo=drizzle&logoColor=black" alt="Drizzle ORM"></a>
  <a href="#"><img src="https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=flat-square&logo=openai&logoColor=white" alt="OpenAI"></a>
  <a href="#"><img src="https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"></a>
  <a href="#"><img src="https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS"></a>
  <a href="#"><img src="https://img.shields.io/badge/Leaflet-1.9-199900?style=flat-square&logo=leaflet&logoColor=white" alt="Leaflet"></a>
  <a href="#"><img src="https://img.shields.io/badge/Esri_Basemaps-ArcGIS-2C7AC3?style=flat-square&logo=arcgis&logoColor=white" alt="Esri"></a>
  <a href="#"><img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/WCAG-2.1_AA-green?style=flat-square" alt="WCAG 2.1 AA"></a>
  <a href="#"><img src="https://img.shields.io/badge/News_Sources-88-blue?style=flat-square" alt="News Sources"></a>
</p>

---

## Overview

The Meridian is a full-stack news aggregation platform that collects articles from **88 sources** across the political spectrum and multiple global regions, clusters them by topic using OpenAI GPT-4o, and generates **neutral, fact-first summaries** with narrative divergence analysis.

Instead of reading one outlet's take, The Meridian shows you what multiple sources agree on, where they diverge, and what's missing from the conversation.

### Key Capabilities

- **Multi-source aggregation** — RSS ingestion from 88 outlets spanning left, center-left, center, center-right, and right editorial perspectives
- **AI-powered clustering** — Articles about the same event are grouped into unified stories using semantic similarity
- **Neutral summarization** — GPT-4o generates balanced summaries with key facts, consensus scores, and divergence analysis
- **Narrative Conflict Map** — Interactive Leaflet map with Esri ArcGIS Dark Gray basemap visualizing global conflicts and geopolitical tensions where sources clash in coverage
- **Edition system** — Filter stories by region (US, UK, Canada, Europe, International) with browser geolocation support
- **Bias indicators** — Every source displays its editorial lean rating alongside its content

---

## Features

### News Feed
- Clustered story cards with neutral headlines and AI-generated summaries
- Consensus scoring (0–100) showing how much sources agree
- Source count per story with bias distribution indicators
- Topic filtering (Politics, World, Business, Technology, Science, Health, etc.)
- Edition-based regional filtering with location detection

### Story Detail
- Full neutral summary with extracted key facts
- Divergence analysis highlighting where sources disagree
- Narrative lens breakdown showing how different outlets frame the story
- Coverage gap detection revealing what's missing from the conversation
- Direct links to all source articles

### Narrative Conflict Map
- Interactive world map powered by Leaflet with Esri ArcGIS World Dark Gray basemap tiles (authenticated via API key)
- Content-aware geocoding using 120+ real-world location database with weighted scoring algorithm
- Headline-priority matching: locations mentioned first in headlines are weighted 10x over summary mentions, with position bonus for tiebreaking
- Demonym support (e.g. "Kenyan", "Nigerian", "Brazilian") for accurate geographic placement
- Zoom-responsive markers with conflict intensity indicators
- Sidebar conflict list for keyboard-accessible navigation
- WCAG 2.1 AA compliant with semantic HTML, ARIA landmarks, and visible focus indicators

### Authentication & Personalization
- Custom email/password authentication with bcrypt hashing (12 rounds)
- Session-based auth with PostgreSQL session store
- Forgot/reset password flow with time-limited tokens
- Post-signup onboarding modal for topic preferences and digest frequency
- All content readable without signing in (no content gates)

### Stock Ticker
- Scrolling market data ticker at the top of the page

### Admin Dashboard
- Manual pipeline trigger for on-demand article ingestion
- Contact form submission management with read/unread tracking
- Source monitoring and management

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (React)                    │
│  Vite · TypeScript · Tailwind · shadcn/ui · Wouter  │
│  TanStack Query · Framer Motion · Leaflet           │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP/JSON
┌──────────────────────▼──────────────────────────────┐
│                  Server (Express)                    │
│  TypeScript · express-session · connect-pg-simple    │
│  bcrypt · rss-parser · OpenAI SDK                    │
└──────────────────────┬──────────────────────────────┘
                       │ Drizzle ORM
┌──────────────────────▼──────────────────────────────┐
│                   PostgreSQL                         │
│  sources · articles · stories · story_articles       │
│  users · sessions · password_reset_tokens            │
│  contact_submissions                                 │
└─────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
├── client/                   # React SPA
│   └── src/
│       ├── components/       # UI components (AuthModal, OnboardingModal, StoryCard, etc.)
│       │   ├── layout/       # Navbar, Footer
│       │   └── ui/           # shadcn/ui primitives
│       ├── hooks/            # Custom hooks (useAuth, useStories, useSources, useEdition)
│       ├── lib/              # Utilities (queryClient, apiRequest)
│       └── pages/            # Route pages (Feed, Story, ConflictMap, Admin, etc.)
├── server/                   # Express API server
│   ├── pipeline.ts           # RSS ingestion + AI clustering + summarization
│   ├── routes.ts             # API route definitions + source registry
│   ├── storage.ts            # Database access layer (IStorage interface)
│   └── replit_integrations/  # Auth, chat, image, audio, batch modules
│       └── auth/             # Custom auth (routes, storage, session config)
├── shared/                   # Shared types and schemas
│   ├── schema.ts             # Drizzle table definitions
│   ├── models/auth.ts        # Auth-specific schema (users, sessions, reset tokens)
│   └── routes.ts             # API route contracts with Zod validation
└── package.json
```

---

## News Sources

The Meridian aggregates from **88 sources** across **12 regional categories**:

| Region | Sources |
|--------|---------|
| **US Mainstream** | NYT, WSJ, AP, Fox News, NPR, Bloomberg, CNBC, OAN |
| **UK** | The Guardian, The Telegraph, The Independent, Sky News, Daily Mail, BBC UK, The Times UK |
| **Canada** | CBC News, Globe and Mail, National Post, CTV News, Toronto Star, Global News |
| **Europe** | Deutsche Welle, France 24, Euronews, Politico Europe, Der Spiegel International, The Local EU, EUobserver |
| **Asia-Pacific** | SCMP, Japan Times, Times of India, Straits Times, ABC News Australia, Nikkei Asia, The Diplomat, Channel News Asia, Kyodo News, The Hindu |
| **Africa** | Africa News, AllAfrica, The East African, Daily Maverick, Premium Times Nigeria, News24 South Africa, The Africa Report |
| **Middle East** | Al Jazeera, Middle East Eye, The National UAE, Haaretz, Arab News, Iran International |
| **Latin America** | Buenos Aires Herald, MercoPress, Mexico News Daily, Brazil Reports |
| **Eastern Europe** | The Moscow Times, Kyiv Independent, TASS English |
| **Humanitarian** | ReliefWeb, UN News, The New Humanitarian, ICRC News |
| **Science & Tech** | Ars Technica, TechCrunch, Wired, The Verge, Scientific American, Nature News, Science Daily, STAT News |
| **Business** | Bloomberg, CNBC, Financial Times, The Economist |

Each source is tagged with an editorial lean rating: `left`, `center-left`, `center`, `center-right`, or `right`.

---

## News Pipeline

The pipeline runs automatically every 30 minutes:

1. **Ingest** — Fetch RSS feeds from all active sources, filter to articles published within the last 48 hours
2. **Deduplicate** — Skip articles already in the database (matched by URL)
3. **Cluster** — Group related articles into stories using OpenAI GPT-4o semantic similarity analysis
4. **Summarize** — Generate neutral headlines, balanced summaries, and key facts for each story cluster
5. **Analyze** — Produce consensus scores, narrative lens breakdowns, divergence summaries, and coverage gap reports
6. **Publish** — Save stories with linked source articles to the database

---

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite 5 | Build tool and dev server with HMR |
| Tailwind CSS 3 | Utility-first styling |
| shadcn/ui (Radix UI) | Component library (New York style) |
| Wouter | Lightweight client-side routing |
| TanStack Query v5 | Server state management and caching |
| Framer Motion | Page transitions and animations |
| Leaflet + react-leaflet | Interactive conflict map |
| Esri ArcGIS Basemaps | Dark Gray world map tiles (authenticated) |
| date-fns | Date formatting |
| Lucide React | Icon library |

### Backend
| Technology | Purpose |
|-----------|---------|
| Express 4 | HTTP server and API routing |
| TypeScript (tsx) | Runtime TypeScript execution |
| Drizzle ORM | Type-safe database queries |
| PostgreSQL | Primary database |
| express-session | Session management |
| connect-pg-simple | PostgreSQL session store |
| bcrypt | Password hashing (12 salt rounds) |
| rss-parser | RSS feed ingestion |
| OpenAI SDK | GPT-4o for clustering and summarization |
| drizzle-zod | Schema-to-validation bridge |
| esbuild | Production server bundling |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- OpenAI API key (for the AI pipeline)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Express session signing secret |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Yes | OpenAI API key for GPT-4o |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Yes | OpenAI API base URL |
| `ESRI_API_KEY` | No | Esri API key for authenticated basemap tile access |
| `GMAIL_APP_PASSWORD` | No | Gmail app password for email features |

### Installation

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The app will be available at `http://localhost:5000`.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account (email, password, firstName, lastName) |
| `POST` | `/api/auth/login` | Sign in with email and password |
| `POST` | `/api/auth/logout` | Destroy session |
| `GET` | `/api/auth/user` | Get current authenticated user |
| `POST` | `/api/auth/forgot-password` | Generate password reset token |
| `POST` | `/api/auth/reset-password` | Reset password with valid token |
| `PATCH` | `/api/auth/preferences` | Update topic preferences and digest frequency |

### Stories
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/stories` | List published stories (supports pagination, region filter) |
| `GET` | `/api/stories/:id` | Get story detail with linked articles and source info |

### Sources
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sources` | List all news sources with bias ratings |

### Contact
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/contact` | Submit contact form |
| `GET` | `/api/contact/submissions` | List all submissions (admin) |
| `PATCH` | `/api/contact/submissions/:id/read` | Mark submission as read |

### Configuration
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/config/map` | Get Esri API key for map tile authentication |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/pipeline/run` | Manually trigger the news pipeline |

---

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Hero section, featured stories, platform overview |
| `/feed` | Feed | Full story listing with topic and edition filters |
| `/story/:id` | Story Detail | Complete story with sources, divergence, and analysis |
| `/conflicts` | Conflict Map | Interactive geopolitical conflict visualization |
| `/sources` | Sources Index | Browse all 88 news sources by bias rating |
| `/methodology` | Methodology | How the AI pipeline and neutrality engine work |
| `/admin` | Admin Dashboard | Pipeline control, contact submissions, monitoring |
| `/about` | About | Platform mission and team information |
| `/contact` | Contact | Contact form with subject categories |
| `/privacy` | Privacy Policy | Data handling and cookie policies |
| `/terms` | Terms of Service | Usage terms and conditions |
| `/auth/reset-password` | Password Reset | Token-based password reset form |

---

## Accessibility

The Meridian follows **WCAG 2.1 AA** compliance standards:

- Semantic HTML with proper heading hierarchy (h1 → h2 → h3)
- ARIA landmarks, roles, and live regions throughout
- Visible focus indicators (focus:ring-2) on all interactive elements
- Minimum touch targets: 36×36px buttons, 44px list items
- Color contrast ratios meeting AA minimums
- Keyboard-accessible navigation for all features
- Conflict map sidebar provides equivalent keyboard access to map markers

---

## License

This project is licensed under the MIT License.

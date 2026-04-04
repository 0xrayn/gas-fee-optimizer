# GasWatch Pro ⛽

Real-time Ethereum gas fee optimizer — multi-chain, live alerts, smart insights.

## Features

- **Multi-chain** — Ethereum, Polygon, Arbitrum
- **Auto-refresh** every 10 seconds with smooth countdown ring
- **Real API** — Etherscan / PolygonScan / Arbiscan (falls back to simulation if no keys)
- **Dark / Light mode** — smooth toggle with OS preference detection
- **Timezone-aware** — auto-detects user timezone, all timestamps localized
- **Gas alert** — set a threshold, get highlighted when gas drops below it
- **Tx Fee Estimator** — shows USD cost for common operations
- **AI Insights** — context-aware advice based on time of day & gas level
- **Animated** — smooth number counters, floating particles, Web3 grid background
- **Tailwind v4** — @theme config, CSS-first, no tailwind.config.js

## Stack

- **Next.js 15** (App Router, Edge Runtime)
- **Tailwind CSS v4** (PostCSS plugin)
- **Recharts** (area chart)
- **Lucide React** (icons)
- **TypeScript** (strict mode)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.example .env.local

# 3. (Optional) Add API keys to .env.local
# App works in simulation mode without keys.

# 4. Start dev server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## API Keys (Optional)

Get free API keys from:
- **Ethereum** → [etherscan.io/myapikey](https://etherscan.io/myapikey)
- **Polygon** → [polygonscan.com/myapikey](https://polygonscan.com/myapikey)
- **Arbitrum** → [arbiscan.io/myapikey](https://arbiscan.io/myapikey)

Add them to `.env.local`:

```env
ETHERSCAN_API_KEY=your_key_here
POLYGONSCAN_API_KEY=your_key_here
ARBISCAN_API_KEY=your_key_here
```

## Project Structure

```
gaswatch/
├── app/
│   ├── api/gas/route.ts     # Edge API route (proxies to Etherscan)
│   ├── globals.css          # Tailwind v4 + keyframes + theme tokens
│   ├── layout.tsx           # Root layout with ThemeProvider + fonts
│   └── page.tsx             # Server component entry
├── components/
│   ├── AnimatedBackground   # Web3 grid + floating orbs background
│   ├── AlertPanel           # Gas alert threshold UI
│   ├── ChainSelector        # ETH / Polygon / Arbitrum switcher
│   ├── Dashboard            # Main client component
│   ├── GasCard              # Animated metric card (smooth counter)
│   ├── GasChart             # Recharts area chart, themed
│   ├── InsightBox           # AI-style insights with timezone hints
│   ├── ThemeProvider        # Context + localStorage + OS preference
│   ├── ThemeToggle          # Dark/Light button with icon animation
│   └── TxEstimator          # Fee estimator for common tx types
├── hooks/
│   └── useGasPolling.ts     # Client polling, history, countdown
├── lib/
│   ├── chains.ts            # Chain configs (colors, labels, APIs)
│   ├── getGas.ts            # Server-side gas fetcher + simulation
│   └── timezone.ts          # All timezone utilities (auto-detect)
└── types/
    └── index.ts             # Shared TypeScript types
```

## Roadmap

- [ ] Wallet connect (wagmi v2)
- [ ] Push notifications (Web Push API)
- [ ] Historical data (The Graph protocol)
- [ ] Gas prediction ML model
- [ ] Mobile PWA support

# ArenaAI 2026 — Smart Stadium Hub

> **A Generative AI-enabled solution that enhances stadium operations and the overall tournament experience** for fans, organizers, volunteers, and venue staff during the FIFA World Cup 2026.

**Live Demo:** [https://promptwars-gp-96741.web.app](https://promptwars-gp-96741.web.app)

---

## 🏗️ Architecture Overview

ArenaAI 2026 is a single-page application (SPA) built with **vanilla JavaScript (ES Modules)** and **Vite** for bundling. It connects to the **Google Gemini 2.5 Flash** model for real-time GenAI-powered features, with a built-in local simulator mode for offline demonstrations.

```
├── index.html           # Semantic HTML5 shell with ARIA roles and CSP
├── index.css            # Custom CSS design system (dark-theme, glassmorphism)
├── app.js               # Main SPA controller (navigation, map, chat, ops)
├── ai-engine.js         # AIEngine class — Gemini API streaming + simulator
├── prompts.js           # System instruction templates + simulator database
├── map-data.js          # Stadium sector geometry, gates, and telemetry data
├── constants.js         # Centralized view/agent/config constants
├── tests.js             # 16-assertion test suite (Node + browser compatible)
├── run-tests.js         # CLI test runner for npm test
├── vite.config.js       # Vite build configuration
├── .eslintrc.json       # ESLint rules (strict quality)
├── .prettierrc          # Prettier formatting rules
└── firebase.json        # Firebase Hosting deployment config
```

## ✨ Key Features

### 🗺️ Interactive Stadium Map & Wayfinding
- SVG-based concourse blueprint with 12 sectors rendered programmatically
- **Live crowd density simulation** — sector colors update every 12 seconds
- Color-coded density heatmap (green/amber/red) with AA-contrast compliance
- Gate markers, elevator locations, and first-aid points with keyboard navigation

### 💬 AI Fan Concierge (Multilingual)
- Chat interface powered by Gemini 2.5 Flash or local NLP simulator
- Streaming response display with typing animation
- Pre-built prompt chips for common fan queries (accessibility, transit, medical)
- PA announcement translator supporting 5 languages (ES, FR, PT, AR, DE)

### 🚨 Operations Command Desk
- Real-time event ticker with severity badges (CRITICAL/WARNING/CONGESTION)
- AI Incident Command that generates structured JSON dispatch briefs
- Smart Volunteer Deployment with zone-based allocation and GenAI optimization
- Sustainability Tracker with carbon offset calculator and waste stream bars
- **Predictive crowd flow alerts** — AI forecasts gate capacity saturation

### 🧪 Prompt Engineering Lab
- Editable system prompts for all 3 AI agents
- Google Gemini API key management with format validation
- In-browser automated test suite with 16 assertions

### ♿ Accessibility
- Skip links, ARIA roles, `aria-live` regions, and `aria-pressed` toggles
- High contrast mode, text magnification (up to 1.4×), and AI text-to-speech
- Full keyboard navigation on all interactive elements including SVG paths
- Screen-reader-only labels on all form inputs

## 🔒 Security

- **Zero `innerHTML` usage** — all DOM construction uses `document.createElement()` and `textContent`
- Custom `safeParseMarkdownToDOM()` parser renders AI markdown without XSS risk
- Content Security Policy (CSP) meta tag restricting script/style/connect sources
- API key format validation with regex before localStorage persistence
- Input length limits (300 chars) to prevent payload abuse

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Install & Run
```bash
npm install
npm run dev         # Start Vite dev server at http://localhost:5173
```

### Run Tests
```bash
npm test            # Runs 16 assertions via Node.js CLI
```

### Build & Deploy
```bash
npm run build                    # Production bundle → dist/
firebase deploy --only hosting   # Deploy to Firebase Hosting
```

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JavaScript (ES Modules) |
| Styling | Custom CSS (dark theme, glassmorphism, micro-animations) |
| AI Model | Google Gemini 2.5 Flash (streaming) |
| Build | Vite 6 |
| Hosting | Firebase Hosting (Google Cloud) |
| Linting | ESLint + Prettier |
| Testing | Custom assertion framework (Node + browser) |

## 📄 License

MIT License. Built for the Google Prompt Wars Challenge 4.

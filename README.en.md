# MathDesk

AI-powered math learning assistant for Japanese high school students preparing for university entrance exams (共通テスト: Math I/A/II/B/C).

> [日本語版](README.md)

## Overview

MathDesk is an interactive tutoring system that helps students who struggle with math. Instead of simply providing answers, the AI character **"Tsuda Mathema-sensei"** coaches students through problem-solving using a Socratic approach — asking questions, providing hints, and building understanding step by step.

### Key Features

- **Adaptive Tutoring**: AI adjusts its coaching style based on student independence level (5 levels from hand-holding to peer discussion)
- **Skill Tree**: 382 skills covering the full scope of Japanese high school math, with prerequisite tracking and mastery progression
- **Error Backtracking**: When a student struggles, the system identifies the root cause and suggests prerequisite skills to review
- **Problem Generation**: AI generates practice problems at 4 difficulty levels, tailored to each skill
- **Visual Support**: JSXGraph-powered mathematical figures with anti-spoiler policies
- **Textbook Integration**: Students can photograph textbook problems for the AI to analyze

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **AI**: Google Gemini (Pro for assessment, Flash for tutoring)
- **Database**: Firestore
- **Auth**: Firebase Authentication
- **Deploy**: Docker, Cloud Run

## Getting Started

### Prerequisites

- Node.js v18+
- Google Cloud Project with Gemini API enabled
- Firebase project (for authentication and database)

### Setup

```bash
git clone https://github.com/orangewk/MathDesk-snapshot.git
cd MathDesk-snapshot

# Install dependencies
npm run install:all

# Configure environment variables
cp prototype/.env.example prototype/.env
cp webapp/.env.example webapp/.env
# Edit both .env files with your credentials

# Start development servers
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:8000

### Docker

```bash
docker compose up
```

Access at http://localhost:8080

## Architecture

```
MathDesk-snapshot/
├── prototype/          # Backend (Express + Gemini API)
│   └── src/
│       ├── api/        # Route handlers (SSE streaming)
│       ├── data/       # Skill definitions, backtrack rules
│       ├── models/     # TypeScript interfaces
│       ├── prompts/    # AI prompt templates
│       └── services/   # Business logic
├── webapp/             # Frontend (React + Vite)
│   └── src/
│       ├── components/ # React components
│       ├── services/   # API clients
│       ├── hooks/      # Custom hooks
│       └── types/      # TypeScript types
└── docs/               # Selected design documents
```

## Design Documents

The private repository contains 150+ documents (planning, investigation, testing, knowledge base) created during development. The following four are included here as examples of the design process:

- [Firestore Index Design](docs/firestore-indexes.md) — Static analysis of all Firestore queries to plan composite indexes declaratively, rather than trial-and-error
- [Chat Speed Optimization](docs/chat-speed-improvement.md) — Multi-tier LLM routing (Flash / Pro Low / Pro High) with A/B test results showing Flash outperformed Pro in all metrics
- [Context Window Design](docs/context-window-design.md) — Prompt compression from 12K to 3.5K tokens, eliminating context loss observed at Turn 9
- [Deployment Architecture](docs/external-deployment.md) — Firebase Hosting + Auth vs Cloud Run monolith comparison for external access

## About This Snapshot

This is a public snapshot of an active private project. The following modifications were made for public release.

### Redacted Files (6)

Function signatures, type definitions, and exports are preserved. Prompt text and detailed data are omitted.

| File | Retained | Omitted |
|------|----------|---------|
| `prompts/system-prompt.ts` | Role definition, character traits | Dialogue patterns, color-coding rules, mastery protocol |
| `prompts/few-shot-examples.ts` | Scoring criteria table, types | All PASS/FAIL/LEARNING_ONLY conversation examples |
| `prompts/problem-generation.ts` | Level 1 instructions, signatures | Level 2–4 instructions, figure generation prompt |
| `prompts/intervention-strategies.ts` | Level names & descriptions (1 line each) | Coaching strategies, phrase examples for all 5 levels |
| `prompts/technique-extraction.ts` | Types, parser, skill ID list generator | Main extraction prompt, few-shot examples |
| `data/backtrack-rules.ts` | Types, helpers, 3 sample rules | Remaining 27 backtrack rules |

### Other Notes

- **Not a standalone deployment**: Requires your own GCP project, Gemini API access, and Firebase setup
- **Design documents**: 4 selected documents included. Internal issue numbers and dates have been removed
- **BGM files omitted**: Music files (`webapp/public/bgm/`) are excluded due to size. The BGM player UI and code remain intact

## License

[MIT](LICENSE)

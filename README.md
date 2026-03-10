# MailMind

MailMind is a front-end email prototype inspired by Microsoft Outlook Web.
It is designed as the foundation for a course project focused on improving the email experience through better organization, lightweight search, and interaction design, without implementing real sending or receiving workflows.

## Overview

This project currently ships as a static HTML/CSS/JavaScript prototype with mock email data.
The goal is to recreate a familiar Outlook-style interface with AI-assisted organization:

- Smart Priority and Smart Folders for automatic mail triage
- Semantic and LLM-powered search
- Improved mail triage interactions

## Current Features

- Outlook-inspired three-panel layout
- Top navigation bar with search
- Collapsible sidebar with folders
- Mail list with unread, starred, and attachment states
- Reading pane for detailed email content
- Tab filtering for all, unread, and flagged emails
- Starred mail virtual view across folders
- **Smart Priority** — AI-powered inbox triage (high / medium / low)
- **Smart Folders** — Create custom folders with name + description; AI classifies emails automatically (LLM or local keyword fallback)
- **AI Search** — Semantic search with LLM understanding, vector similarity, or keyword fallback
- Mock data for inbox, drafts, sent, junk, archive, and deleted

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Google Fonts (`Outfit` and `Plus Jakarta Sans`)
- OpenAI API (optional) — for LLM search and smart folder classification

No backend is required. AI features degrade gracefully when no API key is configured.

## Project Structure

```text
.
├── index.html
├── README.md
├── scripts/
│   ├── app.js              # Main app logic, state, rendering
│   ├── config.js           # OpenAI API key (gitignored template)
│   ├── mail-data.js        # Mock email data
│   ├── ai-priority.js      # Smart Priority classification engine
│   ├── ai-search.js        # LLM + vector + keyword search
│   ├── smart-folders.js    # Smart Folders CRUD + AI classification
│   ├── embeddings.js       # Pre-generated vectors (optional)
│   └── generate-embeddings.js  # Node script to build embeddings
└── styles/
    └── main.css
```

## Getting Started

### Option 1: Open directly

Open `index.html` in your browser.

### Option 2: Use a local static server

If you prefer a local server, you can use any simple static hosting tool, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Design Direction

The interface combines:

- the information architecture of Outlook Web
- a Fluent-inspired visual language
- modern web UI details such as softer depth, refined typography, and lightweight motion

The current implementation prioritizes UI fidelity and extensibility over production email functionality.

## Why This Project Exists

This prototype is the starting point for a course project about improving the email experience.
Instead of rebuilding a full email client, MailMind focuses on the part that matters for the project:
the inbox interface itself.

That makes it easier to test ideas around:

- email organization
- search and discovery
- inbox interaction patterns
- usability improvements

## Optional: Enable AI Features

Create `scripts/config.js` with your OpenAI API key:

```javascript
const OPENAI_API_KEY = 'sk-your-key-here';
```

This enables LLM-based search and smart folder classification. Without it, the app falls back to local keyword matching and vector search (if embeddings are pre-generated).

## Roadmap

Possible next steps include:

- Advanced filtering by sender, date, or tag
- Better keyboard navigation
- Bulk triage actions
- Usability testing and iteration

## Status

This is an early prototype intended for UI exploration and course project development.
It is not connected to a real mail provider and does not implement backend mail operations.

## License

MIT
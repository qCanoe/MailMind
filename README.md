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
- **Automations** — Describe a workflow in natural language (mock “AI” picks a template); automations are stored in `localStorage`. Each automation has a reading-pane detail view with a horizontal pipeline: step type (trigger / process / action), title, description, and **per-step configuration summaries**. The header shows **total run count** (formatted with `Intl`) and **last triggered** time when set; invalid or missing dates degrade to safe placeholder text.
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
│   ├── automations.js      # Automation templates, localStorage CRUD, mock AI template matching
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

### Changing OpenAI models

Model names are **not** configured in `config.js` (that file is only for the API key). Edit the `model` field in the relevant `fetch` payload:

| Use case | File | Notes |
|----------|------|--------|
| **LLM search** (chat completions) | [`scripts/ai-search.js`](scripts/ai-search.js) | Search the `chat/completions` request body for `model:` |
| **Smart folder classification** (chat completions) | [`scripts/smart-folders.js`](scripts/smart-folders.js) | Same: `chat/completions` → `model:` |
| **Embeddings** (semantic search / vectors) | [`scripts/ai-search.js`](scripts/ai-search.js) | `embeddings` request → `model:` |
| **Offline embedding generation** | [`scripts/generate-embeddings.js`](scripts/generate-embeddings.js) | Keep the embedding `model` aligned with runtime if you switch models; re-run the script to regenerate vector files |

If you change the **embedding** model or its dimensions, regenerate embeddings and ensure any stored vectors match what the app expects.

Automation creation uses **client-side template matching** only (keyword map in `automations.js`); it does not call OpenAI. Run counts and last-run timestamps are stored on each automation object but are not incremented by a real mail pipeline unless you wire that up later.

## Roadmap

Possible next steps include:

- Hook automations to real or simulated mail events (increment `runCount`, set `lastRunAt`)
- Advanced filtering by sender, date, or tag
- Better keyboard navigation
- Bulk triage actions
- Usability testing and iteration

## Status

This is an early prototype intended for UI exploration and course project development.
It is not connected to a real mail provider and does not implement backend mail operations.

## License

MIT
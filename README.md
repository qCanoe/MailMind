# MailMind

MailMind is a front-end email prototype inspired by Microsoft Outlook Web.
It is designed as the foundation for a course project focused on improving the email experience through better organization, AI-powered search, and interaction design, without implementing real sending or receiving workflows.

## Overview

This project ships as a static HTML/CSS/JavaScript prototype with mock email data.
The current version recreates an Outlook-style interface and adds **AI search** that truly understands email content via LLM (GPT-5.4), not just keyword or vector similarity matching.

## Current Features

- Outlook-inspired three-panel layout
- Top navigation bar with search
- **AI Search** — LLM-based search that reads and understands emails (GPT-5.4)
- **AI toggle** — Enable/disable AI search on the left of the search bar
- **Copilot panel** — Natural language answers to queries like "有哪些邀请" or "我下周有哪些截止日期"
- Fallback to vector semantic search when LLM is unavailable
- Collapsible sidebar with folders
- Mail list with unread, starred, and attachment states
- Reading pane for detailed email content
- Client-side keyword search with highlighting
- Tab filtering for all, unread, and flagged emails
- Starred mail virtual view across folders
- Mock data for inbox, drafts, sent, junk, and archive

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Google Fonts (`Outfit` and `Plus Jakarta Sans`)
- OpenAI API (Chat Completions + Embeddings)

No backend is required; API calls are made directly from the browser.

## Project Structure

```text
.
├── index.html
├── README.md
├── scripts/
│   ├── config.js          # API key (add to .gitignore)
│   ├── mail-data.js       # Mock mail data
│   ├── app.js             # Main app logic
│   ├── ai-search.js        # LLM + vector search
│   └── generate-embeddings.js
├── styles/
│   └── main.css
└── mvp.md
```

## Getting Started

### 1. API Key Setup

Create `scripts/config.js` with your OpenAI API key:

```javascript
const OPENAI_API_KEY = 'sk-your-api-key-here';
```

> `config.js` should be in `.gitignore` to avoid committing secrets.

### 2. Run the App

**Option A: Open directly**

Open `index.html` in your browser. AI search will work if `config.js` is present and the key is valid.

**Option B: Local static server**

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

### 3. Optional: Pre-generate Embeddings

To avoid real-time embedding calls on first search, run:

```bash
node scripts/generate-embeddings.js
```

This produces `scripts/embeddings.js` with precomputed vectors for the mock data.

## Design Direction

The interface combines:

- The information architecture of Outlook Web
- A Fluent-inspired visual language
- Modern web UI details such as softer depth, refined typography, and lightweight motion

## Roadmap

- Advanced filtering by sender, date, or tag
- Customizable labels and categories
- Better keyboard navigation
- Bulk triage actions
- Usability testing and iteration

## Status

This is a prototype with AI search enabled. It is not connected to a real mail provider and does not implement backend mail operations.

## License

MIT

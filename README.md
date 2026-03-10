# MailMind

MailMind is a front-end email prototype inspired by Microsoft Outlook Web.
It is designed as the foundation for a course project focused on improving the email experience through better organization, lightweight search, and interaction design, without implementing real sending or receiving workflows.

## Overview

This project currently ships as a static HTML/CSS/JavaScript prototype with mock email data.
The goal of the first version is to recreate a familiar Outlook-style interface while keeping the codebase simple enough to extend with future features such as:

- smarter mail organization
- lightweight search and filtering
- improved mail triage interactions
- visual experiments for inbox productivity

## Current Features

- Outlook-inspired three-panel layout
- top navigation bar with search
- collapsible sidebar with folders
- mail list with unread, starred, and attachment states
- reading pane for detailed email content
- client-side search with keyword highlighting
- tab filtering for all, unread, and flagged emails
- starred mail virtual view across folders
- mock data for inbox, drafts, sent, junk, and archive

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Google Fonts (`Outfit` and `Plus Jakarta Sans`)

No backend is required for the current version.

## Project Structure

```text
.
├── index.html
├── README.md
├── scripts/
│   └── app.js
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

## Roadmap

Possible next steps include:

- advanced filtering by sender, date, or tag
- customizable labels and categories
- better keyboard navigation
- bulk triage actions
- AI-assisted organization concepts
- usability testing and iteration

## Status

This is an early prototype intended for UI exploration and course project development.
It is not connected to a real mail provider and does not implement backend mail operations.

## License

MIT
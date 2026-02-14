# Sherlock CLI Tool

> A CLI tool for intelligent codebase analysis. Generate documentation, detect bugs, and explore your project structure — all from the terminal, powered by AI.

**Quick start:** See **[GUIDE.md](./GUIDE.md)** for a short summary and step-by-step usage. Default AI is **Groq** (free cloud, API key required).

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [How It Works](#2-how-it-works)
3. [Tech Stack](#3-tech-stack)
4. [Features](#4-features)
5. [Architecture](#5-architecture)
6. [Roadmap](#6-roadmap)
7. [Project Structure](#7-project-structure)
8. [Installation & Setup](#8-installation--setup)
9. [Usage](#9-usage)
10. [Configuration](#10-configuration)
11. [Contributing](#11-contributing)
12. [Limitations & Known Issues](#12-limitations--known-issues)
13. [Future Ideas](#13-future-ideas)

---

## 1. Project Overview

Sherlock is a local-first CLI tool that analyzes a codebase and produces structured, actionable output. It scans the repository, builds a context-aware representation of the project, and leverages AI to generate documentation, identify potential bugs, and answer questions about the codebase.

Everything runs locally. No code is uploaded to external services — only a structured, minimal context is sent to the AI provider to generate the output.

**The problem it solves:** reading and understanding an existing codebase is where developers spend the majority of their time. Most tools are either too generic (a chatbot that doesn't understand your project structure) or too heavy (full IDE extensions with cloud dependencies). Sherlock sits in the middle — lightweight, fast, and runs entirely in the terminal.

---

## 2. How It Works

```
Your Repo
    │
    ▼
┌──────────────┐
│   Indexer    │  ← Scans the repo, reads files, builds
│              │     dependency map and project metadata
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Context    │  ← Selects only the relevant files based on
│   Builder    │     the current task (docs, bugs, ask, map)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  AI Bridge   │  ← Sends the context to the AI provider,
│              │     receives structured output
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  TUI Layer   │  ← Renders everything interactively
│              │     in the terminal using Ink
└──────────────┘
```

The key design decision is the **Context Builder**: it doesn't dump the entire repo into the AI prompt. It analyzes what the user is asking for and selects only the files and structures that are relevant. This keeps costs low, responses fast, and output accurate.

---

## 3. Tech Stack

| Technology | Role | Why |
|---|---|---|
| **TypeScript** | Language | Strong typing reduces bugs during development. Industry standard for CLI tooling in the Node ecosystem. |
| **Bun** | Runtime | Significantly faster startup than Node.js — critical for a CLI tool where the user feels every millisecond. Native TypeScript support without a separate compilation step. |
| **Commander** | CLI argument parsing | The most adopted CLI framework in the ecosystem. Simple API, solid docs, instantly recognizable to any JS/TS developer. |
| **Ink** | Interactive TUI | Brings React's component model to the terminal. If you know React, you know Ink. Produces modern, interactive interfaces — not just lines of text. |
| **@inkjs/ui** | TUI components | Pre-built components (spinners, selects, progress bars) with a theming system. Saves time on UI primitives so the focus stays on the core logic. |
| **TypeScript API** | Code parsing | Parses imports and module structure for the dependency graph. |
| **Multi-provider AI** | AI integration | Supports Groq, Anthropic, Ollama, Pollinations. Handles API communication and structured output. |
| **chalk** | Terminal styling | Lightweight utility for coloring output. Highlights errors, warnings, and success states in a clean way. |

---

## 4. Features

### 📖 Docs — Generate Documentation

Analyzes the codebase structure and generates structured documentation:

- **Project overview** — purpose, tech stack, setup, and usage inferred from the code.
- **Function documentation** — descriptions and parameter explanations for exported functions and classes.
- **Architecture overview** — how modules relate to each other, entry points, and key flows.

Output is saved to `DOCS.md` in the target repo root.

### 🐛 Bugs — Detect Potential Issues

Scans the code for common problem patterns and produces a structured report:

- **Missing error handling** — functions that don't handle async errors, unhandled promise rejections.
- **Unused imports/variables** — dead code that adds noise.
- **Suspicious logic** — conditions that are always true/false, unreachable code paths.
- **Security red flags** — hardcoded secrets, unsanitized inputs (surface-level scan).

Each issue is reported with: file, line number, severity level (info / warning / error), and a short explanation. Output can be saved to `BUGS.md` when `save_reports` is enabled in `.codeopsrc`.

### 🗺️ Map — Visualize Project Structure

Produces a textual representation of the project's dependency graph:

- Which modules import which.
- Entry points and leaf modules.
- Most connected files (potential single points of failure).
- Git-based stats: which files have changed most frequently.

### 💬 Ask — Q&A on Your Codebase

An interactive mode where the user can ask questions in natural language. Responses stream in real time as they are generated:

- *"How does authentication work in this project?"*
- *"What does the `processPayment` function do?"*
- *"Which modules depend on the database layer?"*

The Context Builder selects the relevant files before sending the request to the AI, so answers are grounded in the actual code.

---

## 5. Architecture

```
sherlock-cli-tool/
│
├── src/
│   ├── cli.ts              ← Entry point. Commander setup, command routing.
│   ├── tui/
│   │   ├── App.tsx         ← Root Ink component. Menu, routing between modes.
│   │   ├── Docs.tsx        ← Docs mode UI.
│   │   ├── Bugs.tsx        ← Bugs mode UI (renders report).
│   │   ├── ModuleMap.tsx   ← Map mode UI (renders dependency graph).
│   │   ├── Ask.tsx         ← Ask mode UI (input + response).
│   │   └── components/     ← Shared UI components (spinner, output box, etc.)
│   ├── core/
│   │   ├── indexer.ts      ← Scans repo, reads files, builds metadata.
│   │   ├── context.ts      ← Context Builder: selects relevant files per task.
│   │   ├── ai/             ← AI Bridge: multi-provider (Groq, Anthropic, Ollama, Pollinations).
│   │   └── git.ts          ← Git integration: history, file change frequency.
│   └── utils/
│       ├── config.ts       ← Reads and validates configuration.
│       ├── code_parser.ts  ← Module graph (imports).
│       └── paths.ts        ← Path resolution, .gitignore parsing.
│
├── package.json
├── tsconfig.json
├── .env.example            ← Template for API key configuration.
└── README.md
```

The architecture follows a clear separation:

- **CLI layer** handles what the user asked for.
- **TUI layer** handles how it looks in the terminal.
- **Core layer** handles the actual work: indexing, context building, AI calls.
- **Utils** handle cross-cutting concerns like config and file paths.

No single file does more than one thing. Each module is independently testable.

---

## 6. Roadmap

### Phase 1 — Foundation (Weeks 1–2)

The goal is a working tool as fast as possible. By the end of this phase, you can point the tool at a repo and get a generated README.

- [ ] Project setup: TypeScript, Bun, Commander, basic Ink TUI.
- [ ] Indexer: scans a directory, reads files, filters by `.gitignore`.
- [ ] AI Bridge: basic call to AI provider API, returns text.
- [ ] First mode: **Docs** — generates a README from the codebase.
- [ ] Basic TUI: menu to select mode, spinner while processing, output display.

### Phase 2 — Depth (Weeks 3–4)

Structural analysis and the Bugs mode.

- [ ] Context Builder: selects relevant files based on the active mode, not the whole repo.
- [ ] **Bugs** mode: analyzes code for common issues, produces a structured report.
- [ ] TUI improvements: severity coloring in the bug report, file/line navigation.

### Phase 3 — Interactivity (Weeks 5–6)

The tool becomes a full interactive experience.

- [ ] **Map** mode: dependency graph rendered as text, git-based file stats.
- [ ] **Ask** mode: interactive Q&A on the codebase with streaming responses.
- [ ] Configuration file support (`.codeopsrc`): set provider, excluded paths, output preferences.
- [ ] Output saving: export docs and bug reports directly to files in the repo.

### Phase 4 — Polish (Week 7)

Production-ready quality.

- [ ] Error handling: graceful failures for API errors, file system issues, unsupported file types.
- [ ] Documentation: complete README, inline code comments, usage examples.

---

## 7. Project Structure

```
sherlock-cli-tool/
├── src/
│   ├── cli.ts
│   ├── tui/
│   │   ├── App.tsx
│   │   ├── Docs.tsx
│   │   ├── Bugs.tsx
│   │   ├── ModuleMap.tsx
│   │   ├── Ask.tsx
│   │   └── components/
│   ├── core/
│   │   ├── indexer.ts
│   │   ├── context.ts
│   │   ├── ai/
│   │   └── git.ts
│   └── utils/
│       ├── config.ts
│       ├── code_parser.ts
│       └── paths.ts
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## 8. Installation & Setup

### Prerequisites

- **Bun** >= 1.0 — [install here](https://bun.sh) (or Node.js with `npx tsx`)
- **AI provider API key** — Groq (free, [console.groq.com](https://console.groq.com)), Anthropic, or use Pollinations/Ollama without a key
- **Git** installed (required for the Map mode and git-based analysis)

### Install

```bash
# Clone the repo
git clone https://github.com/your-username/sherlock-cli-tool.git
cd sherlock-cli-tool

# Install dependencies
bun install

# Configure API key (for Groq/Anthropic)
cp .env.example .env
# Edit .env and add your GROQ_API_KEY or ANTHROPIC_API_KEY
```

### Run

```bash
bun run start
```

---

## 9. Usage

### Interactive mode (default)

```bash
bun run start
```

Launches the interactive TUI. First, a **folder picker** lets you choose which project to analyze — navigate with ↑↓, Enter to open folders or select **▸ Use this folder** to confirm. Then, use arrow keys to select a mode (Docs, Bugs, Map, Ask).

### Direct command

```bash
# Generate documentation
bun run start docs

# Run bug analysis
bun run start bugs

# Show project map
bun run start map

# Ask a question
bun run start ask "How does the auth module work?"
```

### Targeting a specific directory

Use `--path` to skip the folder picker and specify a directory directly:

```bash
bun run start --path /path/to/your/repo docs
bun run start --path /path/to/your/repo
```

---

## 10. Configuration

Sherlock looks for a `.codeopsrc` file in the root of the target repository.

```json
{
  "provider": "groq",
  "model": "llama-3.1-8b-instant",
  "exclude": [
    "node_modules",
    "dist",
    ".git",
    "*.test.ts"
  ],
  "output": {
    "save_reports": true
  }
}
```

| Key | Description | Default |
|---|---|---|
| `provider` | AI provider: `groq`, `anthropic`, `ollama`, `pollinations` | `groq` |
| `model` | Model identifier | `llama-3.1-8b-instant` |
| `exclude` | Patterns to skip during indexing | `["node_modules", "dist", ".git"]` |
| `output.save_reports` | Save bug reports to BUGS.md | `false` |

---

## 11. Contributing

Contributions are welcome. Here's how to get started:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Make your changes. Follow the existing code structure and conventions.
4. Open a Pull Request with a clear description of what you changed and why.

**What's especially welcome:**

- Additional bug detection patterns.
- UI improvements in the TUI layer.
- Performance improvements in the indexer.

---

## 12. Limitations & Known Issues

- **AI accuracy is not guaranteed.** The tool uses AI to generate documentation and detect bugs. Output should always be reviewed by a developer before being committed.
- **Large repos can be slow.** The indexer scans and reads every file on each run.
- **API costs.** Each analysis call uses tokens from your API key (Groq free tier has limits). The Context Builder minimizes this.
- **No offline AI.** The tool requires an active internet connection except when using Ollama (local).

---

## 13. Future Ideas

These are not on the current roadmap but represent natural next steps if the project evolves:

- **VS Code extension** — expose the same analysis capabilities inside an IDE.
- **Additional providers** — add OpenAI, Gemini, and others as selectable providers.
- **Incremental analysis** — only re-analyze files that have changed since the last run.
- **Team mode** — shared analysis results stored in the repo, reviewable in PRs.
- **Plugin system** — allow custom analysis modules written by the community.
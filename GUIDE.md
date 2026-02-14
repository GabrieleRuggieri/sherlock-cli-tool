# Sherlock CLI — Quick Guide

## What is it?

Sherlock is a CLI tool that analyzes your codebase with AI: generate docs, find bugs, map dependencies, and ask questions — all from the terminal.

## Quick Start

```bash
# Install
bun install   # or npm install

# Run Sherlock — you'll be prompted to select a project folder
bun run start

# Or specify a folder directly
bun run start --path /path/to/your/project

# Run a specific analysis (uses current directory if no --path)
bun run start docs
bun run start bugs
bun run start map
bun run start ask "How does authentication work?"
```

When you run `bun run start` without `--path`, a folder picker appears. Navigate with ↑↓, press Enter to open a folder or select **▸ Use this folder** to confirm.

## AI Provider (default: Groq)

- **Groq** — Free cloud, needs `GROQ_API_KEY` in `.env`. Default.
- **Pollinations** — Free, no API key.
- **Ollama** — Free, local. Run `ollama serve` and `ollama pull llama3.2`.
- **Anthropic** — Paid, needs `ANTHROPIC_API_KEY` in `.env`.

Set `provider` and `model` in `.codeopsrc` in your repo root.

## Target a Different Repo

```bash
bun run start --path /path/to/repo docs
```

## Running Without TUI

Use `--no-tui` when the terminal is not interactive (e.g. scripts, CI, or some IDEs):

```bash
bun run start --no-tui docs
bun run start --no-tui bugs
bun run start --no-tui ask "How does auth work?"
```

Without `--no-tui` and without a subcommand, Sherlock shows the interactive menu. If your terminal closes immediately, run a subcommand directly: `bun run start docs`, `bun run start bugs`, etc.

## Output Files

- `DOCS.md` — Generated documentation (docs mode)
- `BUGS.md` — Bug report (bugs mode, when `save_reports: true` in `.codeopsrc`)

## Navigation

- **Folder picker:** ↑↓ navigate, Enter open folder / select, Esc back (if available)
- **Main menu:** ↑↓ + Enter — Select mode
- **Esc** — Go back
- **Ctrl+D** — Quit

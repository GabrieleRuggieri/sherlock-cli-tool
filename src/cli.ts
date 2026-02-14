#!/usr/bin/env bun
import "dotenv/config";
import { program } from "commander";
import { render } from "ink";
import React from "react";
import { resolveTargetDir } from "./utils/paths.js";
import { loadConfig } from "./utils/config.js";
import { saveDocsToOutput, saveBugReportToOutput } from "./utils/output.js";

function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

program
  .name("sherlock")
  .description("CLI for intelligent codebase analysis — docs, bugs, map, ask")
  .version("0.1.0")
  .option("-p, --path <dir>", "Target directory (default: cwd)")
  .option("--no-tui", "Disable TUI and run in plain CLI mode");

program
  .command("docs")
  .description("Generate documentation from the codebase")
  .action(async () => {
    const opts = program.opts();
    const rootDir = resolveTargetDir(opts.path);
    const config = loadConfig(rootDir);
    const { indexRepo } = await import("./core/indexer.js");
    const { buildContext } = await import("./core/context.js");
    const { generateDocs } = await import("./core/ai/index.js");
    const context = buildContext(indexRepo(rootDir, config.exclude), "docs");
    const markdown = await generateDocs(context, config.provider, config.model);
    saveDocsToOutput(rootDir, markdown);
    console.log("Documentation written to DOCS.md");
    console.log(markdown);
  });

program
  .command("bugs")
  .description("Run bug analysis on the codebase")
  .action(async () => {
    const opts = program.opts();
    const rootDir = resolveTargetDir(opts.path);
    const config = loadConfig(rootDir);
    const { indexRepo } = await import("./core/indexer.js");
    const { buildContext } = await import("./core/context.js");
    const { generateBugs } = await import("./core/ai/index.js");
    const context = buildContext(indexRepo(rootDir, config.exclude), "bugs");
    const report = await generateBugs(context, config.provider, config.model);
    if (config.output.save_reports) {
      saveBugReportToOutput(rootDir, report);
      console.log("Bug report written to BUGS.md");
    }
    console.log(report);
  });

program
  .command("ask [question]")
  .description("Ask a question about the codebase")
  .action(async (question?: string) => {
    const opts = program.opts();
    const rootDir = resolveTargetDir(opts.path);
    const config = loadConfig(rootDir);

    if (opts.tui !== false && isInteractive()) {
      try {
        const { default: App } = await import("./tui/App.js");
        const app = React.createElement(App, {
          rootDir,
          config,
          initialMode: "ask",
          initialQuestion: question ?? undefined,
        });
        const instance = render(app);
        await instance.waitUntilExit();
        return;
      } catch (err) {
        console.error("TUI error:", err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    }

    if (!question) {
      console.log("Provide a question: sherlock ask \"How does auth work?\"");
      return;
    }
    const { indexRepo } = await import("./core/indexer.js");
    const { buildContext } = await import("./core/context.js");
    const { generateAskStream } = await import("./core/ai/index.js");
    const context = buildContext(
      indexRepo(rootDir, config.exclude),
      "ask",
      question
    );
    for await (const chunk of generateAskStream(
      context,
      question,
      config.provider,
      config.model
    )) {
      process.stdout.write(chunk);
    }
    process.stdout.write("\n");
  });

program
  .command("map")
  .description("Show project structure and dependency map")
  .action(async () => {
    const opts = program.opts();
    if (opts.tui === false) {
      console.log("Map mode requires TUI. Run without --no-tui.");
      process.exit(1);
    }
    if (!isInteractive()) {
      console.log("Map mode requires an interactive terminal.");
      process.exit(1);
    }
    const rootDir = resolveTargetDir(opts.path);
    const config = loadConfig(rootDir);
    try {
      const { default: App } = await import("./tui/App.js");
      const app = React.createElement(App, {
        rootDir,
        config,
        initialMode: "map",
      });
      const instance = render(app);
      await instance.waitUntilExit();
    } catch (err) {
      console.error("TUI error:", err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program
  .command("start")
  .description("Start interactive mode with folder picker (default)")
  .action(async () => {
    const opts = program.opts();
    if (opts.tui === false || !isInteractive()) {
      console.log("Start command requires interactive TUI. Run: sherlock");
      process.exit(1);
    }
    try {
      const { default: App } = await import("./tui/App.js");
      const app = React.createElement(App, {
        initialPickPath: process.cwd(),
      });
      const instance = render(app);
      await instance.waitUntilExit();
    } catch (err) {
      console.error("TUI error:", err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program
  .argument("[mode]", "docs | bugs | map | ask (optional; default: interactive with folder picker)")
  .action(async (mode?: string) => {
    const opts = program.opts();
    if (opts.tui === false) {
      console.log("TUI disabled. Use a subcommand:");
      console.log("  sherlock docs");
      console.log("  sherlock bugs");
      console.log("  sherlock map");
      console.log("  sherlock ask \"Your question here\"");
      process.exit(0);
    }
    if (!isInteractive()) {
      console.log("Not running in an interactive terminal. Use a subcommand with --no-tui:");
      console.log("  sherlock --no-tui docs");
      console.log("  sherlock --no-tui bugs");
      console.log("  sherlock --no-tui ask \"Your question\"");
      process.exit(1);
    }
    // With --path: use that dir and optionally skip to a mode
    // Without --path: show folder picker first
    const hasPath = !!opts.path;
    const rootDir = hasPath ? resolveTargetDir(opts.path) : undefined;
    const config = rootDir ? loadConfig(rootDir) : undefined;
    try {
      const { default: App } = await import("./tui/App.js");
      const app = React.createElement(App, {
        rootDir,
        config,
        initialMode: hasPath ? mode ?? undefined : undefined,
        initialPickPath: process.cwd(),
      });
      const instance = render(app);
      await instance.waitUntilExit();
    } catch (err) {
      console.error("TUI error:", err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program.parse();

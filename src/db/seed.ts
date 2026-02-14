import "dotenv/config";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { projects } from "./schema";

// ---------------------------------------------------------------------------
// Seed data — the 4 initial projects
// ---------------------------------------------------------------------------

const seedProjects = [
  {
    slug: "dify",
    name: "Dify",
    description:
      "Open-source platform for building AI-powered apps with visual workflows, RAG pipelines, and agent capabilities.",
    longDescription: `Dify is an open-source LLM application development platform that lets you build AI-powered applications visually. Think of it as a no-code/low-code builder for AI workflows.

With Dify you can:
• Create AI chatbots with custom knowledge bases (RAG)
• Build multi-step AI workflows using a visual drag-and-drop editor
• Connect to multiple LLM providers (OpenAI, Anthropic, local models)
• Deploy your AI apps as APIs or standalone web apps

It's used by thousands of companies to prototype and ship AI features without writing complex LLM orchestration code.`,
    githubUrl: "https://github.com/langgenius/dify",
    category: "AI App Builder",
    language: "Python",
    stars: 60000,
    imageTag: "nginx:alpine", // TODO: Replace with agentropic/dify:latest once built
    port: 80,
    healthCheckPath: "/",
    status: "live" as const,
  },
  {
    slug: "gpt-researcher",
    name: "GPT Researcher",
    description:
      "Autonomous AI agent that conducts comprehensive research on any topic, generating detailed reports with citations.",
    longDescription: `GPT Researcher is an autonomous research agent that can conduct thorough, objective research on any topic you give it.

Give it a research question, and it will:
• Generate a research plan with sub-questions
• Search the web for relevant sources
• Read and analyze multiple articles and papers
• Synthesize findings into a comprehensive report with citations
• Generate the report in various formats (PDF, Word, Markdown)

It's like having a research assistant that can digest dozens of sources in minutes and produce a well-structured, cited report. Great for market research, competitive analysis, literature reviews, or any topic you need to understand deeply.`,
    githubUrl: "https://github.com/assafelovic/gpt-researcher",
    category: "Research Agent",
    language: "Python",
    stars: 16000,
    imageTag: "nginx:alpine", // TODO: Replace with agentropic/gpt-researcher:latest once built
    port: 80,
    healthCheckPath: "/",
    status: "live" as const,
  },
  {
    slug: "bolt-new",
    name: "Bolt.new",
    description:
      "AI-powered full-stack web app builder. Describe what you want and watch it generate a complete working application.",
    longDescription: `Bolt.new (by StackBlitz) is an AI-powered development environment that can generate full-stack web applications from natural language descriptions.

Tell it what you want to build, and it will:
• Generate a complete project with frontend, backend, and database
• Write clean, production-quality code using modern frameworks
• Set up the development environment automatically
• Let you iterate by describing changes in plain English
• Deploy your app with one click

It's the fastest way to go from an idea to a working web application. Perfect for prototyping, building MVPs, or creating internal tools without writing code yourself.`,
    githubUrl: "https://github.com/stackblitz/bolt.new",
    category: "Coding Agent",
    language: "TypeScript",
    stars: 25000,
    imageTag: "nginx:alpine", // TODO: Replace with agentropic/bolt-new:latest once built
    port: 80,
    healthCheckPath: "/",
    status: "live" as const,
  },
  {
    slug: "openclaw",
    name: "OpenClaw",
    description:
      "Open-source AI agent framework for building autonomous task-completion agents with tool use and memory.",
    longDescription: `OpenClaw is an open-source framework for building AI agents that can autonomously complete complex tasks by using tools, maintaining memory, and planning multi-step workflows.

Key capabilities:
• Define custom tools that your agent can use (web search, code execution, API calls, file operations)
• Built-in memory system so agents can learn from past interactions
• Multi-step planning — agents break down complex tasks into actionable steps
• Human-in-the-loop support for high-stakes decisions
• Works with multiple LLM providers

It's designed for developers and teams building production AI agent systems, but the web UI makes it accessible to anyone who wants to see what autonomous AI agents can do.`,
    githubUrl: "https://github.com/openclaw/openclaw",
    category: "Agent Framework",
    language: "Python",
    stars: 8000,
    imageTag: "nginx:alpine", // TODO: Replace with agentropic/openclaw:latest once built
    port: 80,
    healthCheckPath: "/",
    status: "live" as const,
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is not set.");
    console.error("Create a .env.local file with DATABASE_URL=... or set it in your environment.");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  console.log("Seeding projects...\n");

  for (const project of seedProjects) {
    console.log(`  Upserting: ${project.name} (${project.slug})`);

    await db
      .insert(projects)
      .values(project)
      .onConflictDoUpdate({
        target: projects.slug,
        set: {
          name: project.name,
          description: project.description,
          longDescription: project.longDescription,
          githubUrl: project.githubUrl,
          category: project.category,
          language: project.language,
          stars: project.stars,
          imageTag: project.imageTag,
          port: project.port,
          healthCheckPath: project.healthCheckPath,
          status: project.status,
        },
      });
  }

  console.log(`\nDone! Seeded ${seedProjects.length} projects.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

---
name: CSVT Library
language: TypeScript
stacks:
  - Node.js
  - Vitest
docs:
  - path: README.md
    importance: HIGH
    description: Start here - Overview, Usage, API Docs, Scripts.
  - path: docs/spec.md
    importance: High
    description: Project Specification v0.1.0 (English) - Rules, Types, Constraints.
  - path: docs/project_structure.md
    importance: Medium
    description: Detailed directory structure description.
configs:
  - package.json
  - tsconfig.json
  - vitest.config.ts
  - .prettierrc.json
---

# AI Context: CSVT Library

Use the metadata in the YAML Frontmatter above and the instructions below for context on this project.

**Instructions for AI Assistant:**

1.  **Primary Goal:** Assist with development, answer questions, and troubleshoot issues related to this library.
2.  **Initial Understanding (Build Context):**
    *   Parse the **YAML Frontmatter** for key metadata (`name`, `language`, `stacks`, `docs`, `configs`).
    *   **Thoroughly review the primary documents listed in `docs`:**
        *   **Start with `README.md`** (marked HIGH importance) for the essential overview, setup, usage, API, and scripts.
        *   **Then, familiarize yourself with the core rules and concepts** defined in the specification documents (`spec.md` - if listed). Pay attention to version info in the `description`.
        *   Understand the project layout by checking `project_structure.md` (if listed).
    *   **Goal:** Build a foundational understanding of the project's purpose, the CSVT format it handles, its structure, and how it's built/tested *before* tackling specific tasks.
3.  **Navigating the Codebase & Environment:**
    *   Core technologies are listed under `language` and `stacks`.
    *   Essential configuration files are listed under `configs`. Use these to understand the build, dependencies, testing setup, etc.
    *   Pay special attention to `package.json` for version, scripts, and dependencies.
4.  **General:**
    *   Apply project conventions and maintain code quality.
    *   Ask clarifying questions if the provided context is insufficient or ambiguous after reviewing the initial documents.

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
changelog: CHANGELOG.md
---

# AI Context: {{ name }}

Use the metadata in the YAML Frontmatter above and the instructions below for context on this project.

**Instructions for AI Assistant:**

1.  **Primary Goal:** Assist with development, answer questions, and troubleshoot issues related to the `{{ name }}` library.
2.  **Understanding the Project:**
    *   **Parse the YAML Frontmatter** for key metadata (`name`, `language`, `stacks`, `docs`, `configs`, `changelog`).
    *   **Consult the `docs` list in YAML:**
        *   **MUST READ `README.md` first** (marked HIGH importance) for the essential overview, setup, usage, API, and scripts.
        *   Refer to the specification documents (`spec.md`, `spec-ja.md` - if listed) for detailed format rules. Note specific version info in their `description`.
        *   Check `project_structure.md` (if listed) for directory layout details.
3.  **Navigating the Codebase & Environment:**
    *   Core technologies are listed under `language` and `stacks`.
    *   Essential configuration files are listed under `configs`. Use these to understand the build, dependencies, testing setup, etc.
    *   Pay special attention to `package.json` for version, scripts, and dependencies.
4.  **History & Changes:**
    *   Check the file specified in `changelog` (if listed) for the history of changes.
5.  **General:**
    *   Apply project conventions and maintain code quality.
    *   Ask clarifying questions if the provided context is insufficient.

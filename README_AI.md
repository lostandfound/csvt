# Project Overview for AI Assistants: CSVT Library

This document provides context for AI assistants helping with the development of this TypeScript CSVT library.

**1. Project Goal & Summary:**

*   **What:** This is a TypeScript library for handling the CSVT (CSV with Types) format.
*   **CSVT Format:** Extends standard CSV by adding data type information to the header row (e.g., `columnName:typeName`). See the specification documents for details.
*   **Core Functionality:**
    *   `parseCsvt`: Parses a CSVT string into structured JavaScript objects, validating data against specified types.
    *   `writeCsvt`: Generates a CSVT formatted string from an array of JavaScript objects.
*   **Purpose:** To reduce ambiguity in CSV data and improve reliability during data processing.
*   **Current Library Version:** `0.1.1` (Check `package.json` for the latest).

**2. Technology Stack:**

*   **Language:** TypeScript
*   **Testing:** Vitest (`vitest.config.ts`, tests in `tests/`)
*   **Building:** `tsc` (TypeScript Compiler, configured via `tsconfig.json`)
*   **Package Management:** npm (`package.json`)
*   **Formatting:** Prettier (`.prettierrc.json`)

**3. Key Files & Documentation (Where to Look):**

*   **`README.md` (HIGHLY IMPORTANT):** Contains the project overview, installation instructions, basic usage examples for `parseCsvt` and `writeCsvt`, API documentation, and development scripts. **Please start here to understand the project.**
*   **`docs/spec.md` (English) / `docs/spec-ja.md` (Japanese):** Defines the CSVT specification (currently corresponds to v0.1.0). Essential for understanding the format rules, data types, and constraints.
*   **`src/`:** Contains the TypeScript source code.
    *   `index.ts`: Main library entry point, exports public API.
    *   `parserEntry.ts`, `parser.ts`: Logic for parsing.
    *   `writer.ts`: Logic for writing (serializing).
    *   `validator.ts`: Data validation logic.
    *   `types.ts`: Shared type definitions.
    *   `utils.ts`: Utility functions.
*   **`tests/`:** Contains unit and integration tests (`*.spec.ts`).
*   **`examples/`:** Contains usage example scripts (`basic-usage.ts`, `writer-usage.ts`).
*   **`package.json`:** Defines dependencies, scripts (`build`, `test`, `format`, etc.), and the library version.
*   **`CHANGELOG.md`:** Records notable changes for each version.
*   **`tsconfig.json`:** TypeScript compiler options.

**4. Instructions for AI:**

*   Please assist with development tasks, answer questions, and help troubleshoot issues related to this project.
*   Refer to `README.md` first to grasp the project context.
*   Consult the specification documents (`docs/spec.md` or `docs/spec-ja.md`) for details on the CSVT format itself.
*   Use the information in `package.json` and `tsconfig.json` when dealing with dependencies, build processes, or module resolution.
*   Check `CHANGELOG.md` for historical context.

Thank you for your assistance! 
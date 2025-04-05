# Project Folder Structure

```
csvt/
├── dist/              # Build artifacts (JavaScript + type definitions .d.ts)
├── docs/              # Documentation (spec-ja.md, spec.md, etc.)
│   ├── spec-ja.md
│   └── spec.md
├── examples/          # Library usage examples
│   └── basic-usage.ts
├── src/               # TypeScript source code
│   ├── parser.ts      # CSVT parsing core logic
│   ├── validator.ts   # Data type and constraint validation logic
│   ├── types.ts       # Type definitions used within the library (e.g., error types)
│   ├── utils.ts       # Utility functions (e.g., string manipulation)
│   └── index.ts       # Library entry point (public API)
├── tests/             # Test code (Vitest)
│   ├── parser.spec.ts
│   ├── validator.spec.ts
│   ├── utils.spec.ts  # Added utils test file
│   └── index.spec.ts
├── .gitignore         # Git ignore list
├── .prettierrc.json   # Prettier configuration
├── package.json       # Project definition and dependencies
├── tsconfig.json      # TypeScript compiler configuration
└── vitest.config.ts   # Vitest configuration
```

## Description

*   **`/src`**: Contains the main implementation of the library.
    *   `parser.ts`: Handles the parsing of the CSVT string.
    *   `validator.ts`: Performs type and constraint checks based on the specification.
    *   `index.ts`: Combines these functionalities and provides the public API.
    *   `utils.ts`: Provides utility functions used across the library.
    *   `types.ts`: Defines shared TypeScript types.
*   **`/tests`**: Contains unit and integration tests using Vitest. Files typically end with `.spec.ts`.
*   **`/dist`**: Stores the compiled JavaScript output and type definition files (`.d.ts`). This directory should be included in `.gitignore`.
*   **`/docs`**: Stores documentation files like the specification (`spec-ja.md`, `spec.md`).
*   **`/examples`**: Contains sample code demonstrating how to use the library (`basic-usage.ts`).
*   **Root**: Configuration files for the project (TypeScript, Prettier, Vitest, npm). 
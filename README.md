# CSVT (CSV with Types) Library

[![npm version](https://badge.fury.io/js/csvt.svg)](https://badge.fury.io/js/csvt) <!-- Placeholder - update if published -->

This TypeScript library provides tools to parse and validate CSVT (CSV with Types) formatted strings based on the [CSVT Specification](./docs/spec-ja.md).

CSVT extends standard CSV by adding type information to the header row (e.g., `columnName:typeName`), enhancing data clarity and enabling robust validation.

## Features

*   Parses CSVT strings into structured JavaScript objects.
*   Validates data against types specified in the header (`string`, `number`, `bool`, `date`, `datetime`, `array`, `object`).
*   Supports non-null constraints (`!`).
*   Handles standard CSV quoting and escaping (RFC 4180).
*   Provides different error handling modes (`strict`, `collect`, `substituteNull`).
*   Written in TypeScript with type definitions included.

## Installation

```bash
npm install csvt
# or
yarn add csvt
```

## Basic Usage

```typescript
import { parseCsvt } from 'csvt';

const csvtString = `id:number!,name,registered:bool,score:number
1,Alice,true,95
2,Bob,false,
3,Charlie,true,88`;

// Default mode is 'strict' (throws on first error)
try {
  const result = parseCsvt(csvtString);
  console.log('Parsed Data:', result.data);
  // Output:
  // Parsed Data: [
  //   { id: 1, name: 'Alice', registered: true, score: 95 },
  //   { id: 2, name: 'Bob', registered: false, score: null },
  //   { id: 3, name: 'Charlie', registered: true, score: 88 }
  // ]
  console.log('Headers:', result.headers);
  console.log('Errors:', result.errors); // Should be empty
} catch (error) {
  console.error('Parsing failed:', error);
}

// --- Collect errors ---
const csvtWithErrors = `id:number!,value:number
1,10
,20 \n3,thirty`;

const resultCollect = parseCsvt(csvtWithErrors, { errorMode: 'collect' });
console.log('\nCollect Mode Data:', resultCollect.data);
// Output: Collect Mode Data: [ { id: 1, value: 10 } ] (only valid rows)
console.log('Collect Mode Errors:', resultCollect.errors);
// Output: Collect Mode Errors: [
//   { type: 'constraint', message: '...', row: 3, ... },
//   { type: 'type', message: '...', row: 4, ... }
// ]

// --- Substitute Null on Type Error ---
const resultSubstitute = parseCsvt(csvtWithErrors, { errorMode: 'substituteNull' });
console.log('\nSubstituteNull Mode Data:', resultSubstitute.data);
// Output: SubstituteNull Mode Data: [ { id: 1, value: 10 }, { id: 3, value: null } ] (row 2 skipped due to constraint error)
console.log('SubstituteNull Mode Errors:', resultSubstitute.errors); // Errors are still collected

```

## API

### `parseCsvt<T = Record<string, unknown>>(csvtString: string, options?: CsvtParseOptions): CsvtParsedResult<T>`

*   **`csvtString`**: The CSVT string to parse.
*   **`options`** (optional):
    *   **`errorMode`**: Specifies how to handle errors.
        *   `'strict'` (default): Throws an error on the first encountered issue (parsing or validation).
        *   `'collect'`: Collects all errors. Invalid rows (due to format, constraint, or type errors) are typically excluded from the `data` array.
        *   `'substituteNull'`: Collects all errors. Attempts to substitute `null` for fields with *type errors* (if the field is nullable). Rows with *constraint violations* are still excluded.
*   **Returns**: `CsvtParsedResult<T>`
    *   **`data: T[]`**: An array of parsed data rows, where each row is an object mapping header names to validated/converted values. The structure `T` can be specified via the generic parameter.
    *   **`headers: CsvtHeader[]`**: An array describing the parsed headers (name, type, non-null status, index).
    *   **`errors: CsvtError[]`**: An array of errors encountered during parsing or validation.

See `src/types.ts` for detailed type definitions of `CsvtHeader`, `CsvtError`, `CsvtParseOptions`, and `CsvtParsedResult`.

## Specification

This library aims to conform to the [CSVT Specification (Japanese)](./docs/spec.md).

## Development

*   **Build:** `npm run build`
*   **Test:** `npm test`
*   **Lint:** `npm run lint`
*   **Format:** `npm run format`

## License

MIT 
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

### `writeCsvt(data: Record<string, any>[], options?: CsvtWriteOptions): string`

Generates a CSVT formatted string from an array of JavaScript objects.

*   **`data`**: An array of objects representing the rows to write. Each object's keys correspond to the column names.
*   **`options`** (optional):
    *   **`headers`**: An array of `CsvtHeaderInput` objects (`{ name: string; type: CsvtDataType; isNonNull?: boolean }`) to explicitly define the header order, types, and nullability. If not provided, headers are inferred from the first object in the `data` array (type inference is basic: `string`, `number`, `boolean`, `object`, `array`, `date`, `datetime`). Header names containing delimiters (`,`), quotes (`"`), or colons (`:`) will be automatically quoted.
    *   **`delimiter`**: The delimiter character to use (default: `,`).
*   **Returns**: `string` - The generated CSVT string.
*   **Behavior:**
    *   Values are converted and formatted according to their inferred or specified type.
    *   `Date` objects are formatted as ISO strings (only date part for `date`, full ISO string for `datetime`).
    *   `array` and `object` types are stringified using `JSON.stringify` and then properly escaped according to CSV rules.
    *   `null` and `undefined` values are represented as empty fields.
    *   Values containing delimiters, quotes, or newlines are automatically enclosed in double quotes, with internal quotes escaped (`"` becomes `""`).

**Example:**

```typescript
import { writeCsvt } from 'csvt';

const dataToWrite = [
  { id: 1, name: 'Alice', score: 95.5, tags: ['A', 'B'], createdAt: new Date() },
  { id: 2, name: 'Bob, Jr.', score: null, tags: ['C'], createdAt: new Date() }
];

// Infer headers
const csvtString1 = writeCsvt(dataToWrite);
console.log(csvtString1);
/* Output (example):
id:number!,name:string,score:number,tags:array,createdAt:datetime
1,Alice,95.5,"["A","B"]",2023-10-27T10:00:00.000Z
2,"Bob, Jr.",,"["C"]",2023-10-27T10:01:00.000Z
*/

// Specify headers
const csvtString2 = writeCsvt(dataToWrite, {
  headers: [
    { name: 'id', type: 'number', isNonNull: true },
    { name: 'name', type: 'string' },
    { name: 'score', type: 'number' },
    { name: 'createdAt', type: 'date' } // Only include date part
    // 'tags' column is omitted
  ]
});
console.log(csvtString2);
/* Output (example):
id:number!,name:string,score:number,createdAt:date
1,Alice,95.5,2023-10-27
2,"Bob, Jr.",,2023-10-27
*/
```

### `parseCsvtStream<T = Record<string, unknown>>(readableStream: ReadableStream, options?: CsvtParseOptions): AsyncIterable<CsvtParsedResult<T>>`

Parses a CSVT data stream efficiently, processing data chunk by chunk.

*   **`readableStream`**: A `ReadableStream` providing the CSVT data (e.g., from `fs.createReadStream` piped through `Readable.toWeb`).
*   **`options`** (optional): Same options as `parseCsvt`, including `errorMode` (`strict`, `collect`, `substituteNull`).
*   **Returns**: `AsyncIterable<CsvtParsedResult<T>>`
    *   Yields `CsvtParsedResult<T>` objects as data rows are parsed. Each yielded object contains:
        *   `data: T[]`: An array containing a **single** parsed data row (or potentially more if internal buffering occurs, though typically one).
        *   `headers: CsvtHeader[]`: The parsed header information (consistent across all yielded results after the header is parsed).
        *   `errors: CsvtError[]`: Any errors encountered *for that specific yielded row* (in `collect` or `substituteNull` mode).
    *   In `strict` mode, the iterable will throw an error on the first issue.
    *   The iterable completes when the stream ends.

### `writeCsvtStream(data: AsyncIterable<Record<string, any>> | Iterable<Record<string, any>>, options?: CsvtWriteOptions): ReadableStream`

Generates a CSVT formatted data stream from an iterable (synchronous or asynchronous) source of JavaScript objects.

*   **`data`**: An `Iterable` or `AsyncIterable` providing the objects to write as rows.
*   **`options`** (optional): Same options as `writeCsvt`, including `headers` (for explicit definition) and `delimiter`.
*   **Returns**: `ReadableStream` - A stream that emits the generated CSVT data as strings (header row first, then data rows).
*   **Behavior:**
    *   Similar to `writeCsvt`, headers are written first (either explicitly defined or inferred from the first item in `data`).
    *   Each object from the `data` iterable is formatted into a CSVT row string and pushed to the output stream.
    *   Value conversion, formatting, and escaping rules are the same as `writeCsvt`.

## Future Enhancements

The following features are planned for future releases:

*   **Validation API:**
    *   `validateData`: Validate existing JavaScript data arrays against CSVT header definitions, independent of parsing.
*   **Header Utilities:**
    *   `extractHeaders`: Quickly extract header information (`CsvtHeader[]`) from a CSVT string.
    *   `inferHeaders`: Infer `CsvtHeaderInput[]` from a JavaScript data array for use with `writeCsvt`.
*   **Conversion Utilities:**
    *   `transformCsvToCsvt`: Convert standard CSV strings to CSVT format using provided header definitions.

## Specification

This library aims to conform to the CSVT Specification (v0.1.0) defined within this repository:

*   [CSVT Specification (English, v0.1.0)](./docs/spec.md)
*   [CSVT 仕様 (日本語, v0.1.0)](./docs/spec-ja.md)

## Development

*   **Build:** `npm run build`
*   **Test:** `npm test`
*   **Lint:** `npm run lint`
*   **Format:** `npm run format`

## License

MIT 
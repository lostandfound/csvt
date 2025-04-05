# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2025-04-06 <!-- Release date -->

### Added

-   Implemented streaming parser function `parseCsvtStream` to handle large CSVT data efficiently from `ReadableStream`.
    -   Supports chunk handling and line reconstruction.
    -   Reuses existing validation and type conversion logic.
    -   Provides `AsyncIterable<CsvtParsedResult<T>>` interface.
    -   Supports error modes (`strict`, `collect`, `substituteNull`).
-   Implemented streaming writer function `writeCsvtStream` to generate CSVT data streams from synchronous (`Iterable`) or asynchronous (`AsyncIterable`) data sources.
    -   Returns a `ReadableStream` emitting CSVT strings.
    -   Supports explicit header definition and inference from the first data item.
    -   Reuses existing serialization and escaping logic.
-   Added comprehensive unit tests for streaming functions (`parseCsvtStream`, `writeCsvtStream`) in `tests/streaming.spec.ts`.
-   Added example usage files for streaming API: `examples/streaming-parser-example.ts` and `examples/streaming-writer-example.ts`.
-   Updated `README.md` with API documentation for `parseCsvtStream` and `writeCsvtStream`.

### Changed

-   Refactored `parseCsvtStream` to consistently yield `CsvtParsedResult<T>`, including errors within the `errors` array instead of yielding `CsvtError` objects directly in non-strict modes.
-   Updated `validateAndConvert` to return an empty string (`""`) instead of `null` for nullable `string` types when the input is an empty string, aligning behavior across parsing modes. (Discovered during streaming implementation).
-   Updated `escapeHeaderName` helper to consistently quote header names containing spaces, improving robustness. (Discovered during streaming implementation).
-   Updated tests in `tests/validator.spec.ts` and `tests/writer.spec.ts` to align with the changes in `validateAndConvert` and `escapeHeaderName`.
-   Updated `src/index.ts` to export streaming functions.

### Fixed

-   Resolved various type errors and linter issues identified during the implementation and testing of streaming functions and related refactoring.

## [0.1.1] - 2025-04-05

### Added

-   Implemented `writeCsvt` function to serialize JavaScript data (array of objects) into CSVT format string.
-   Added support for automatic header generation and basic type inference (`string`, `number`, `boolean`, `date`, `datetime`, `array`, `object`) in `writeCsvt`.
-   Added support for explicit header definition via `options.headers` in `writeCsvt`, allowing control over column order, type specification, and non-null constraints (`!`).
-   Implemented data type formatting for writing:
    -   `Date` objects are formatted as ISO strings (full for `datetime`, date-only for `date`).
    -   `array` and `object` types are stringified using `JSON.stringify` and escaped.
-   Ensured proper CSV field escaping (quotes, delimiters, newlines) according to RFC 4180 in `writeCsvt`.
-   Added comprehensive unit tests for the writer functionality in `tests/writer.spec.ts`.
-   Added a usage example file for the writer: `examples/writer-usage.ts`.
-   Updated `README.md` with API documentation and examples for `writeCsvt`.
-   Updated `docs/project_structure.md` to include new writer files.

## [0.1.0] - 2025-04-05

### Added

-   Initial implementation of `parseCsvt` function.
-   Support for basic data types: `string`, `number`, `bool`.
-   Support for non-null constraint (`!`).
-   Error handling modes: `strict`, `collect`, `substituteNull`.
-   Basic CSV parsing according to RFC 4180 (delimiter, quotes, newlines).
-   Unit tests for parser, validator, and utils.
-   Basic usage examples.
-   Initial `README.md`, `LICENSE`, and project configuration files.
-   CSVT Specification documents (`docs/spec.md`, `docs/spec-ja.md`). 
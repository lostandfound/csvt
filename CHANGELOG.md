# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
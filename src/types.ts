/**
 * Represents a potential error encountered during CSVT parsing or validation.
 */
export interface CsvtError {
  /** The type of error (e.g., 'format', 'type', 'constraint'). */
  type: 'format' | 'type' | 'constraint';
  /** A machine-readable error code (optional). */
  code?: string;
  /** A human-readable description of the error. */
  message: string;
  /** The 1-based row number where the error occurred (header is row 1). */
  row: number;
  /** The 1-based column number where the error occurred (optional). */
  column?: number;
  /** The name of the column where the error occurred (optional). */
  columnName?: string;
  /** The problematic value (optional). */
  value?: string;
}

/**
 * Represents the parsed header information.
 */
export interface CsvtHeader {
  /** The original name of the column as specified in the header. */
  name: string;
  /** The specified data type (lowercase). Defaults to 'string'. */
  type: string; // Consider defining specific types later e.g., 'string' | 'number' | ...
  /** Indicates if the non-null constraint (!) is applied. */
  isNonNull: boolean;
  /** The 1-based index of the column. */
  columnIndex: number;
}

/**
 * Represents the result of parsing a CSVT file.
 */
export interface CsvtParsedResult<T = Record<string, unknown>> {
  /** Array of parsed data rows. Type T defines the structure of each row object. */
  data: T[];
  /** Array containing header information for each column. */
  headers: CsvtHeader[];
  /** Array of errors encountered during parsing and validation (if any). */
  errors: CsvtError[];
}

/**
 * Options for the CSVT parser.
 */
export interface CsvtParseOptions {
  /**
   * Specifies the error handling mode.
   * - 'strict' (default): Throws an error on the first encountered issue.
   * - 'collect': Collects all errors and returns them in the result.
   * - 'substituteNull': Attempts to substitute null for invalid values (respects non-null constraints).
   */
  errorMode?: 'strict' | 'collect' | 'substituteNull';
  // Add other options as needed, e.g., expected headers, custom type parsers
}

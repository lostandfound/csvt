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

// --- Writer Types ---

/**
 * Represents the explicit definition for a single column header during writing.
 */
export interface ExplicitColumnHeader {
  /** The name of the column. */
  name: string;
  /** The data type name (e.g., 'string', 'number!', 'date'). */
  type: string; // Allows 'string!', 'number!', etc. directly
}

/**
 * Options for the CSVT writer function (`writeCsvt`).
 */
export interface WriteOptions {
  /**
   * Defines how the header row is generated.
   * - If not provided (or undefined), headers are automatically generated based on the keys of the first data object.
   *   Basic type inference ('string', 'number', 'bool') might be applied. Non-null constraints are not automatically added.
   * - If an array of `ExplicitColumnHeader` is provided, these definitions are used directly.
   *   Automatic type inference is skipped.
   */
  headers?: ExplicitColumnHeader[];

  /**
   * Specifies the line break character(s) to use.
   * @default '\n' (LF)
   */
  lineBreak?: '\n' | '\r\n';

  /**
   * Specifies the delimiter character to use.
   * @default ',' (Comma)
   */
  delimiter?: string; // Typically ',', but allow others

  /**
   * (Future consideration) Option to specify date/datetime formatting.
   */
  // dateFormat?: string;
  // dateTimeFormat?: string;

  /**
   * (Future consideration) Option to control JSON stringification behavior.
   */
  // jsonStringifyOptions?: { space?: string | number };
}

// Known basic types for potential inference during writing
export type CsvtBasicDataType = 'string' | 'number' | 'bool' | 'date' | 'datetime' | 'array' | 'object';

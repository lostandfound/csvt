import type {
  CsvtParseOptions,
  CsvtParsedResult,
  CsvtHeader,
  CsvtError,
} from './types.js';
import { parseHeaderLine } from './parser.js';
import { splitCsvLine } from './utils.js';
import { validateAndConvert } from './validator.js';

/**
 * Parses a CSVT string according to the specification.
 *
 * @param csvtString The CSVT string to parse.
 * @param options Parsing options.
 * @returns An object containing the parsed data, headers, and errors.
 * @throws {Error} Throws an error in 'strict' mode if parsing or validation fails.
 */
export function parseCsvt<T = Record<string, unknown>>(
  csvtString: string,
  options?: CsvtParseOptions
): CsvtParsedResult<T> {
  const errorMode = options?.errorMode ?? 'strict';
  const errors: CsvtError[] = [];
  let headers: CsvtHeader[] = [];
  const rawData: string[][] = []; // Store raw string data initially

  // Normalize line endings and split into lines
  const lines = csvtString.replace(/\r\n|\r/g, '\n').split('\n');

  // Handle empty input
  if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
    if (errorMode === 'strict') {
      throw new Error('CSVT Error (Row: 1): Input is empty');
    }
    return {
      data: [] as T[],
      headers: [],
      errors: [{ type: 'format', message: 'Input is empty', row: 1 }],
    };
  }

  // Parse Header (Line 1)
  const headerLine = lines[0]!;
  const headerResult = parseHeaderLine(headerLine);
  if (headerResult.error) {
    if (errorMode === 'strict') {
      throw new Error(
        `CSVT Error (Row: ${headerResult.error.row}): ${headerResult.error.message}`
      );
    }
    errors.push(headerResult.error);
    // In collect/substituteNull mode, we might still try to parse data if header parsing failed partially?
    // For now, let's stop if header parsing fails completely.
    return {
      data: [] as T[],
      headers: [],
      errors,
    };
  }
  headers = headerResult.headers;

  // Parse Data Rows (Line 2 onwards)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    const rowNumber = i + 1;

    // Skip empty lines at the end of the file
    if (line === '' && i === lines.length - 1) {
        continue;
    }

    let fields: string[];
    try {
      fields = splitCsvLine(line);
    } catch (e: unknown) {
      const error: CsvtError = {
        type: 'format',
        message: e instanceof Error ? e.message : 'Failed to split data line',
        row: rowNumber,
      };
      if (errorMode === 'strict') {
        throw new Error(`CSVT Error (Row: ${error.row}): ${error.message}`);
      }
      errors.push(error);
      // Skip this row in collect/substituteNull mode if splitting failed
      continue;
    }

    // Check field count consistency
    if (fields.length !== headers.length) {
       const error: CsvtError = {
        type: 'format',
        message: `Expected ${headers.length} fields, but found ${fields.length}`,
        row: rowNumber,
      };
       if (errorMode === 'strict') {
        throw new Error(`CSVT Error (Row: ${error.row}): ${error.message}`);
      }
      errors.push(error);
      // Skip this row in collect/substituteNull mode if field count mismatch
      continue;
    }

    rawData.push(fields);
  }

  // --- Phase 3 & 4: Data Validation, Conversion, and Error Handling ---
  const validatedData: T[] = [];

  for (let rowIndex = 0; rowIndex < rawData.length; rowIndex++) {
    const rowFields = rawData[rowIndex]!;
    const rowNumber = rowIndex + 2; // Data rows start from line 2
    const rowObject: Record<string, unknown> = {};
    let shouldSkipRow = false; // Flag to indicate if row processing should be aborted

    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const header = headers[colIndex]!;
      const rawValue = rowFields[colIndex]!;

      const validationResult = validateAndConvert(rawValue, header, rowNumber);

      if (validationResult.error) {
        const error = validationResult.error;
        errors.push(error); // Always collect errors regardless of mode

        if (errorMode === 'strict') {
          // Error already pushed, now throw
          throw new Error(`CSVT Error (Row: ${error.row}, Col: ${error.column}): ${error.message}`);
        }

        if (errorMode === 'substituteNull') {
            if (header.isNonNull && error.type === 'constraint') {
                 // Cannot substitute null for non-nullable constraint violation
                 shouldSkipRow = true;
                 break; // Stop processing this row
            } else if (error.type === 'type') {
                rowObject[header.name] = null; // Substitute null for type errors
            }
            // If constraint violation on nullable field -> null already returned by validator
        } else if (errorMode === 'collect') {
            // In collect mode, error is collected, skip the rest of the row
            shouldSkipRow = true;
            break; 
        }
      } else {
        // No error, assign the validated value
        rowObject[header.name] = validationResult.value;
      }
    }

    // Add row to results only if it wasn't marked for skipping
    if (!shouldSkipRow) {
         validatedData.push(rowObject as T);
    }
  }
  // --- End Phase 3 & 4 ---

  // Final result assembly
  const result: CsvtParsedResult<T> = {
    data: validatedData,
    headers: headers,
    errors: errors,
  };

  // Strict mode check needs to happen *after* all processing if errors were collected
  if (errorMode === 'strict' && result.errors.length > 0) {
    // This check should theoretically not be reached if strict mode throws earlier,
    // but kept as a safeguard.
    const firstError = result.errors[0]!;
    throw new Error(
      `CSVT Error (Row: ${firstError.row}, Col: ${firstError.column}): ${firstError.message}`
    );
  }

  return result;
}

// Potential future functions:
// export function validateCsvt(data: any[], headers: CsvtHeader[]): CsvtError[] { ... }
// export function stringifyCsvt(data: any[], headers: CsvtHeader[]): string { ... }

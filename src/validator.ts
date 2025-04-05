import type { CsvtHeader, CsvtError } from './types.js';
import { cleanCsvField } from './utils.js';

/**
 * Regular expression for basic ISO 8601 datetime format validation.
 * Allows for date, time, optional fractional seconds, and timezone (Z or +/-HH:MM).
 */
const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|([+-])\d{2}:\d{2})$/;

/**
 * Validates and potentially converts a raw string value based on the header definition.
 *
 * @param rawValue The raw string value from the CSV field.
 * @param header The header definition for the column.
 * @param rowNumber The current row number (for error reporting).
 * @returns An object containing the validated/converted value or an error.
 */
export function validateAndConvert(rawValue: string, header: CsvtHeader, rowNumber: number): { value?: unknown; error?: CsvtError } {
    const cleanedValue = cleanCsvField(rawValue);

    // 1. Check for NULL (empty string) before type validation
    if (cleanedValue === '') {
        if (header.isNonNull) {
            // Non-null constraint violation
            return {
                error: {
                    type: 'constraint',
                    message: `Non-null constraint violation: Field '${header.name}' cannot be empty.`,
                    row: rowNumber,
                    column: header.columnIndex,
                    columnName: header.name,
                    value: rawValue, // Show original value in error
                },
            };
        }
        // Null is allowed, return null
        return { value: null };
    }

    // 2. Validate/Convert based on type
    switch (header.type) {
        case 'string':
            // For string, the cleaned value is the result
            return { value: cleanedValue };

        case 'number': {
            const num = Number(cleanedValue);
            if (isNaN(num)) {
                // Failed to parse as a number
                return {
                    error: {
                        type: 'type',
                        message: `Invalid number format for field '${header.name}'. Expected a number, got '${cleanedValue}'.`,
                        row: rowNumber,
                        column: header.columnIndex,
                        columnName: header.name,
                        value: rawValue,
                    },
                };
            }
            return { value: num };
        }

        case 'bool': {
            const lowerValue = cleanedValue.toLowerCase();
            if (lowerValue === 'true' || cleanedValue === '1') {
                return { value: true };
            }
            if (lowerValue === 'false' || cleanedValue === '0') {
                return { value: false };
            }
            // Unrecognized boolean format
            return {
                error: {
                    type: 'type',
                    message: `Invalid boolean format for field '${header.name}'. Expected 'true', 'false', '1', or '0', got '${cleanedValue}'.`,
                    row: rowNumber,
                    column: header.columnIndex,
                    columnName: header.name,
                    value: rawValue,
                },
            };
        }

        case 'date': {
            // Regex for YYYY-MM-DD format
            const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!isoDateRegex.test(cleanedValue)) {
                 return {
                    error: {
                        type: 'type',
                        message: `Invalid date format for field '${header.name}'. Expected YYYY-MM-DD, got '${cleanedValue}'.`,
                        row: rowNumber,
                        column: header.columnIndex,
                        columnName: header.name,
                        value: rawValue,
                    },
                };
            }
            // Optional: Further validation like checking if the date itself is valid (e.g., 2023-02-30)
            // const dateObj = new Date(cleanedValue + 'T00:00:00Z'); // Treat as UTC midnight
            // if (isNaN(dateObj.getTime())) { ... error ... }

            // Return the valid string representation
            return { value: cleanedValue };
        }

        case 'datetime': {
            if (!isoDateTimeRegex.test(cleanedValue)) {
                return {
                    error: {
                        type: 'type',
                        message: `Invalid datetime format for field '${header.name}'. Expected basic ISO 8601 format (e.g., YYYY-MM-DDTHH:MM:SSZ), got '${cleanedValue}'.`,
                        row: rowNumber,
                        column: header.columnIndex,
                        columnName: header.name,
                        value: rawValue,
                    },
                };
            }
            // Keep the original valid string
            return { value: cleanedValue };
        }

        case 'array': {
            try {
                const parsed = JSON.parse(cleanedValue);
                if (!Array.isArray(parsed)) {
                    throw new Error('Parsed value is not an array.');
                }
                return { value: parsed }; // Return the parsed array
            } catch (e: unknown) {
                 return {
                    error: {
                        type: 'type',
                        message: `Invalid array format for field '${header.name}'. Failed to parse as JSON array: ${e instanceof Error ? e.message : String(e)}. Got '${cleanedValue}'.`,
                        row: rowNumber,
                        column: header.columnIndex,
                        columnName: header.name,
                        value: rawValue,
                    },
                };
            }
        }

        case 'object': {
            try {
                const parsed = JSON.parse(cleanedValue);
                // Check if it's a non-null object and not an array
                if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
                    throw new Error('Parsed value is not a valid object.');
                }
                return { value: parsed }; // Return the parsed object
            } catch (e: unknown) {
                 return {
                    error: {
                        type: 'type',
                        message: `Invalid object format for field '${header.name}'. Failed to parse as JSON object: ${e instanceof Error ? e.message : String(e)}. Got '${cleanedValue}'.`,
                        row: rowNumber,
                        column: header.columnIndex,
                        columnName: header.name,
                        value: rawValue,
                    },
                };
            }
        }

        default:
            // Unknown type specified in header
            return {
                error: {
                    type: 'format', // Or maybe 'type'?
                    message: `Unknown data type '${header.type}' specified for column '${header.name}'.`,
                    row: 1, // Error originates from header definition
                    column: header.columnIndex,
                    columnName: header.name,
                },
            };
    }
} 
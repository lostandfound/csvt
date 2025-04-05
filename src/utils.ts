// Utility functions 

/**
 * Splits a single line of CSV text into an array of raw fields, respecting RFC 4180 quoting rules.
 *
 * Returns fields including surrounding quotes and escaped quotes ("") as they appear in the line.
 * Subsequent cleaning (removing surrounding quotes, unescaping) should be done separately.
 * Assumes the input string does not contain line breaks within quoted fields.
 *
 * @param line The CSV line string to split.
 * @param delimiter The character used as a delimiter (default: ',').
 * @returns An array of strings representing the raw fields in the line.
 * @throws {Error} Throws an error if an unterminated quote is found.
 */
export function splitCsvLine(line: string, delimiter: string = ','): string[] {
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;
    let startIndex = 0;

    for (let i = 0; i < line.length; i++) {
        const char = line[i]!;

        if (!inQuotes) {
            // Not inside quotes
            if (char === delimiter) {
                fields.push(currentField);
                currentField = '';
                startIndex = i + 1;
            } else if (char === '"' && i === startIndex) { // Check if quote is at the start of the field
                inQuotes = true;
                currentField += '"'; // Add the opening quote to the raw field
            } else {
                currentField += char;
            }
        } else {
            // Inside quotes
            currentField += char; // Add character, including quotes
            if (char === '"' ) {
                // Check for escaped quote (" ")
                if (i + 1 < line.length && line[i + 1] === '"') {
                    currentField += '"'; // Add the second quote of the escaped pair
                    i++; // Skip the next quote
                } else {
                    // This is the closing quote
                    inQuotes = false;
                    // The closing quote itself was already added.
                }
            }
            // Any other character inside quotes is just added
        }
    }

    // Add the last field
    fields.push(currentField);

    // Check for unterminated quote error - if the loop finished while inQuotes is true
    if (inQuotes) {
        throw new Error('Unterminated quoted field in CSV line');
    }

    return fields;
}

/**
 * Cleans a CSV field value according to CSVT interpretation rules.
 * Currently removes surrounding quotes and unescapes double quotes.
 * Does NOT trim whitespace by default.
 * @param field The raw field value from splitCsvLine.
 * @returns The cleaned field value.
 */
export function cleanCsvField(field: string): string {
  if (field.length >= 2 && field.startsWith('"') && field.endsWith('"')) {
    // Remove surrounding quotes and unescape double quotes ""
    return field.substring(1, field.length - 1).replace(/""/g, '"');
  }
  return field;
}

/**
 * Escapes a field value for CSV output according to RFC 4180.
 * Encloses the field in double quotes if it contains the delimiter, double quotes, or newline characters.
 * Escapes existing double quotes within the field by doubling them.
 * @param value The value to escape (converted to string).
 * @param delimiter The delimiter character used in the CSV.
 * @returns The escaped CSV field string.
 */
export function escapeCsvField(value: string, delimiter: string): string {
    // Check if quoting is necessary
    const needsQuoting = 
        value.includes(delimiter) || 
        value.includes('"') || 
        value.includes('\n') || 
        value.includes('\r');

    if (!needsQuoting) {
        return value;
    }

    // Escape double quotes within the value
    const escapedValue = value.replace(/"/g, '""');

    // Enclose in double quotes
    return `"${escapedValue}"`;
} 
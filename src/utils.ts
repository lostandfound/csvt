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
 * Cleans a CSV field value by removing surrounding quotes (if present)
 * and unescaping doubled quotes.
 *
 * @param rawField The raw field string from CSV splitting.
 * @returns The cleaned field value.
 */
export function cleanCsvField(rawField: string): string {
    // Trim whitespace *outside* quotes first. Standard CSV usually doesn't trim inside quotes.
    // Let's reconsider trimming - RFC 4180 implies spaces are significant unless quoted.
    // If not trimming here, the caller (parser/validator) might need to trim based on context.
    // For now, let's NOT trim here, to reflect raw splitting more accurately.
    // const trimmedField = rawField.trim();
    const field = rawField; // No trim initially

    if (field.startsWith('"') && field.endsWith('"')) {
        // Remove surrounding quotes
        let value = field.slice(1, -1);
        // Unescape doubled quotes ""
        value = value.replace(/""/g, '"');
        return value;
    }
    // If not properly quoted, return the field as is (including potential spaces).
    return field;
} 
/**
 * This module contains the logic for writing JavaScript data to CSVT format.
 */

import type { WriteOptions, ExplicitColumnHeader, CsvtBasicDataType } from './types.js';
import { escapeCsvField } from './utils.js'; // Assuming escape function will be here

/**
 * Serializes an array of JavaScript objects into a CSVT formatted string.
 *
 * @template T - The type of the objects in the data array.
 * @param data - An array of objects to serialize.
 * @param options - Optional configuration for writing the CSVT string.
 * @returns The generated CSVT string.
 * @example
 * ```typescript
 * const data = [
 *   { id: 1, name: "Alice", registered: true, created_at: new Date() },
 *   { id: 2, name: "Bob", registered: false, created_at: new Date() },
 * ];
 *
 * // Automatic header generation
 * const csvtString = writeCsvt(data);
 *
 * // Explicit header definition
 * const options: WriteOptions = {
 *   headers: [
 *     { name: 'User ID', type: 'number!' }, // Renamed header
 *     { name: 'name', type: 'string' },
 *     { name: 'isActive', type: 'bool!' }, // Different key implicitly mapped? (Need to handle key mapping)
 *     { name: 'creationDate', type: 'date' } // Type override
 *   ]
 * };
 * // const csvtStringWithOptions = writeCsvt(data, options);
 * ```
 */
export function writeCsvt<T extends object>(data: T[], options?: WriteOptions): string {
  if (!data || data.length === 0) {
    return ''; // Return empty string for empty data
  }

  const opts: Required<Pick<WriteOptions, 'delimiter' | 'lineBreak'>> & WriteOptions = {
    delimiter: options?.delimiter ?? ',',
    lineBreak: options?.lineBreak ?? '\n',
    ...options,
  };

  // 1. Determine Headers
  const headers = determineHeaders(data, opts.headers);
  const headerRow = generateHeaderRow(headers, opts.delimiter);

  // 2. Generate Data Rows
  const dataRows = data.map(row => generateDataRow(row, headers, opts.delimiter));

  // 3. Combine Header and Data Rows
  return [headerRow, ...dataRows].join(opts.lineBreak);
}

// --- Internal Helper Functions --- (To be implemented)

interface InternalHeader extends ExplicitColumnHeader {
    key: string; // The original key from the data object
}

function determineHeaders(data: object[], explicitHeaders?: ExplicitColumnHeader[]): InternalHeader[] {
    if (explicitHeaders) {
        // Use explicit headers, assuming keys match data keys (or handle mapping later)
        return explicitHeaders.map(h => ({ ...h, key: h.name })); // Simple mapping for now
    }

    if (data.length === 0) return [];

    // Infer from first data object keys
    const firstRowKeys = Object.keys(data[0]!);
    return firstRowKeys.map(key => {
        // Basic type inference (can be improved)
        const sampleValue = data[0]![key as keyof typeof data[0]];
        let inferredType: CsvtBasicDataType = 'string';
        if (typeof sampleValue === 'number') inferredType = 'number';
        else if (typeof sampleValue === 'boolean') inferredType = 'bool';
        else if ((sampleValue as any) instanceof Date) inferredType = 'datetime';
        else if (Array.isArray(sampleValue)) inferredType = 'array';
        else if (typeof sampleValue === 'object' && sampleValue !== null) inferredType = 'object';

        return {
            key: key,
            name: key, // Use key as name by default
            type: inferredType as string, // For now, allow any string type from inference
        };
    });
}

// Escapes a header name if necessary (contains delimiter, newline, colon, space, or quotes)
export function escapeHeaderName(name: string, delimiter: string): string {
    const needsQuoting = 
        name.includes(delimiter) || 
        name.includes(':') ||         // Check for colon specifically
        name.includes(' ') ||         // Check for space
        name.includes('"') || 
        name.includes('\n') || 
        name.includes('\r');

    if (!needsQuoting) {
        return name;
    }
    const escapedName = name.replace(/"/g, '""');
    return `"${escapedName}"`;
}

function generateHeaderRow(headers: InternalHeader[], delimiter: string): string {
  return headers.map(header => {
    const escapedHeaderName = escapeHeaderName(header.name, delimiter); // Use dedicated function
    return `${escapedHeaderName}:${header.type}`;
  }).join(delimiter);
}

function generateDataRow<T extends object>(row: T, headers: InternalHeader[], delimiter: string): string {
  return headers.map(header => {
    const value = row[header.key as keyof T];
    const serializedValue = serializeValue(value);
    return escapeCsvField(serializedValue, delimiter); // Assuming escapeCsvField handles empty string for null/undefined
  }).join(delimiter);
}

export function serializeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object') { // Includes arrays
    try {
      return JSON.stringify(value);
    } catch (e) {
      return ''; // Or throw error?
    }
  }
  return String(value); // Fallback for other types (e.g., BigInt)
}

// Note: escapeCsvField function needs to be implemented or imported correctly from utils.ts
//       and handle potential changes needed for writer context (e.g., delimiter). 
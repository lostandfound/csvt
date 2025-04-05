import type { CsvtHeader, CsvtError } from './types.js';
import { splitCsvLine, cleanCsvField } from './utils.js';

export function parseHeaderLine_revised(headerLine: string): { headers: CsvtHeader[]; error?: CsvtError } {
  if (!headerLine || headerLine.trim() === '') {
    return { headers: [], error: { type: 'format', message: 'Header line is empty', row: 1 } };
  }

  let rawFields: string[];
  try {
    rawFields = splitCsvLine(headerLine);
  } catch (e: unknown) {
    return { headers: [], error: { type: 'format', message: e instanceof Error ? e.message : 'Failed to split header line', row: 1 } };
  }

  const headers: CsvtHeader[] = [];
  const knownTypes = new Set(['string', 'number', 'bool', 'date', 'datetime', 'array', 'object']);

  for (let i = 0; i < rawFields.length; i++) {
    const rawField = rawFields[i]!;
    const trimmedField = rawField.trim();

    if (trimmedField === '' || trimmedField === '""') {
      return {
        headers: [],
        error: {
          type: 'format',
          message: `Header name at index ${i} is effectively empty`,
          row: 1,
          column: i + 1,
        },
      };
    }

    const effectiveColonIndex = trimmedField.lastIndexOf(':');
    let name = '';
    let type = 'string';
    let isNonNull = false;

    if (effectiveColonIndex !== -1) {
      // Colon found: Split name and type parts
      const namePartRaw = trimmedField.substring(0, effectiveColonIndex);
      let typePartRaw = trimmedField.substring(effectiveColonIndex + 1).trim(); // Trim spaces around type spec

      name = cleanCsvField(namePartRaw).trim(); // Clean and trim name part

      if (typePartRaw.endsWith('!')) {
        isNonNull = true;
        typePartRaw = typePartRaw.slice(0, -1).trim(); // Remove '!' and trim again
      }

      // Check for empty type spec AFTER removing '!'
      if (typePartRaw === '') {
        return {
          headers: [],
          error: {
            type: 'format',
            message: `Type specification is missing after colon for header '${name || '(empty name part)'}'`,
            row: 1,
            column: i + 1,
            value: rawField,
          },
        };
      }

      // Check for invalid characters in type spec
      if (typePartRaw.includes('"') || typePartRaw.includes(':')) {
        return {
          headers: [],
          error: {
            type: 'format',
            message: `Invalid characters found in type specification '${typePartRaw}' for header '${name}'`, 
            row: 1,
            column: i + 1,
            value: rawField,
          },
        };
      }

      type = typePartRaw.toLowerCase();
      if (!knownTypes.has(type)) {
        return {
          headers: [],
          error: {
            type: 'format',
            message: `Unknown data type '${type}' for header '${name}'`,
            row: 1,
            column: i + 1,
          },
        };
      }

    } else {
      // No effective colon found separating name and type.
      let potentialNameRaw = trimmedField;

      // Check if the whole field ends with '!' (and is not just "!")
      if (potentialNameRaw.endsWith('!') && potentialNameRaw.length > 1) {
        isNonNull = true;
        potentialNameRaw = potentialNameRaw.slice(0, -1); // Remove trailing '!'
        type = 'string'; // Type defaults to string
      } else {
        // '!' is part of name or not present
        isNonNull = false;
        type = 'string'; // Type defaults to string
      }

      name = cleanCsvField(potentialNameRaw).trim(); // Clean the (potentially modified) field as name
    }

    // Final check for empty name AFTER cleaning and processing
    if (!name) {
      return {
        headers: [],
        error: {
          type: 'format',
          message: `Header name is missing or became empty after cleaning at index ${i}`,
          row: 1,
          column: i + 1,
        },
      };
    }

    headers.push({
      name: name,
      type: type,
      isNonNull: isNonNull,
      columnIndex: i + 1,
    });
  }

  const nameMap = new Map<string, number>();
  for (const header of headers) {
    if (nameMap.has(header.name)) {
      return {
        headers: [],
        error: {
          type: 'format',
          message: `Duplicate header name found: '${header.name}'`,
          row: 1,
        },
      };
    }
    nameMap.set(header.name, header.columnIndex);
  }

  return { headers };
}

export { parseHeaderLine_revised as parseHeaderLine }; 
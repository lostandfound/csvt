/**
 * @fileoverview Implements streaming parsing functionality for CSVT.
 */

import type {
    CsvtParseOptions,
    CsvtParsedResult,
    CsvtHeader,
    CsvtError,
    WriteOptions,
    ExplicitColumnHeader,
} from './types.js';
import { parseHeaderLine } from './parser.js';
import { validateAndConvert } from './validator.js';
import { splitCsvLine, escapeCsvField } from './utils.js'; // Need splitCsvLine for data rows
import { serializeValue, escapeHeaderName } from './writer.js'; // Import serializeValue and escapeHeaderName

/**
 * Finds the index of the first newline character that is not enclosed within double quotes.
 * Handles escaped double quotes (" ").
 * @param str The string to search within.
 * @param startIndex Optional index to start searching from.
 * @returns The index of the unquoted newline, or -1 if not found.
 */
function findUnquotedNewlineIndex(str: string, startIndex = 0): number {
    let inQuotes = false;
    for (let i = startIndex; i < str.length; i++) {
        const char = str[i]!;
        if (char === '"') {
            // Check for escaped quote
            if (inQuotes && i + 1 < str.length && str[i + 1] === '"') {
                i++; // Skip the next quote as it's escaped
            } else {
                inQuotes = !inQuotes; // Toggle quote state
            }
        } else if (char === '\n' && !inQuotes) {
            return i; // Found unquoted newline
        }
    }
    return -1; // No unquoted newline found
}

/**
 * Parses a CSVT string from a ReadableStream line by line.
 *
 * @template T The expected type of the data objects in the result.
 * @param {ReadableStream<Uint8Array>} readableStream The input stream containing CSVT data (UTF-8 encoded).
 * @param {CsvtParseOptions} [options] Parsing options, including error handling mode.
 * @returns {AsyncGenerator<CsvtParsedResult<T>>} An async generator yielding CsvtParsedResult objects.
 *          Each yielded object represents either a successfully parsed data row (in `data` array, typically one element)
 *          or errors encountered for a specific row (in `errors` array, with `data` being empty).
 *          The header information is available on the first successfully yielded CsvtParsedResult.
 * @throws {CsvtError} Throws an error immediately in 'strict' mode if encountered.
 */
export async function* parseCsvtStream<T = Record<string, unknown>>(
    readableStream: ReadableStream<Uint8Array>,
    options?: CsvtParseOptions,
): AsyncGenerator<CsvtParsedResult<T>> { // Always yield CsvtParsedResult<T>
    const errorMode = options?.errorMode ?? 'strict';
    const reader = readableStream.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let headers: CsvtHeader[] | null = null;
    let headerError: CsvtError | null = null;
    let rowNumber = 1; // Header is row 1
    let headerYielded = false;

    try {
        while (true) {
            const { done, value } = await reader.read();
            // DEBUG: Log chunk read
            // console.log(`[DEBUG] Stream read: done=${done}, value size=${value?.length ?? 0}`);

            let decodedChunk = '';
            if (value) {
                decodedChunk = decoder.decode(value, { stream: true });
                buffer += decodedChunk;
                 // DEBUG: Log buffer state after append
                // console.log(`[DEBUG] Decoded chunk: "${decodedChunk.replace(/\n/g, '\\n').replace(/\r/g, '\\r')}", Buffer: "${buffer.replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"`);
            }

            let lineEndIndex;
            // DEBUG: Log entering inner loop check
            // console.log(`[DEBUG] Checking buffer for lines (or done=${done}). Buffer length: ${buffer.length}`);
            while ((lineEndIndex = findUnquotedNewlineIndex(buffer)) !== -1 || (done && buffer.length > 0)) {
                 // DEBUG: Log inner loop condition met
                // console.log(`[DEBUG] Inner loop condition met: lineEndIndex=${lineEndIndex}, done=${done}, buffer.length=${buffer.length}`);

                // Handle both \n and \r\n, and the final chunk without newline
                let line: string;
                if (lineEndIndex !== -1) {
                    line = buffer.substring(0, lineEndIndex);
                    if (line.endsWith('\r')) {
                        line = line.slice(0, -1);
                    }
                    const remainingBuffer = buffer.substring(lineEndIndex + 1);
                    // DEBUG: Log line extraction
                    // console.log(`[DEBUG] Extracted line (\n found): "${line.replace(/\r/g, '\\r')}", Remaining buffer: "${remainingBuffer.replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"`);
                    buffer = remainingBuffer;
                } else {
                    // Last chunk without a trailing newline
                    line = buffer;
                    buffer = '';
                    // DEBUG: Log last line extraction
                    // console.log(`[DEBUG] Extracted last line (no \n): "${line.replace(/\r/g, '\\r')}", Buffer now empty`);
                }

                // --- Process the extracted line --- (Header or Data)
                // console.log(`[DEBUG] Processing extracted line: "${line}"`);
                if (headers === null && headerError === null) {
                    // --- Parse Header Line --- (Row 1)
                    const headerResult = parseHeaderLine(line);
                    if (headerResult.error) {
                        headerError = headerResult.error;
                        if (errorMode === 'strict') {
                            throw headerError; // Throw immediately in strict mode
                        }
                        // In collect/substitute, yield the error wrapped in a result object.
                        // Headers are not available yet. Cannot yield data.
                        yield { data: [], headers: [], errors: [headerError] };
                        // Cannot continue parsing without valid headers
                        return;
                    } else {
                        headers = headerResult.headers;
                        // Header parsed successfully, don't yield yet, wait for first data row
                    }
                    rowNumber++; // Move to data row processing
                    continue; // Move to next line or chunk
                }

                // --- Process Data Lines --- (Row 2 onwards)
                if (headers) { // Ensure headers are parsed successfully
                    if (line.trim() === '') {
                       // Skip empty data lines silently.
                       rowNumber++; // Increment for skipped empty line
                       continue;
                    }

                    let rawFields: string[];
                    try {
                        rawFields = splitCsvLine(line);
                    } catch (e: unknown) {
                        const formatError: CsvtError = {
                            type: 'format',
                            message: `Failed to parse CSV row: ${e instanceof Error ? e.message : String(e)}`,
                            row: rowNumber,
                            value: line,
                        };
                        if (errorMode === 'strict') throw formatError;
                        // Yield error wrapped in result
                        yield { data: [], headers: headerYielded ? [] : headers, errors: [formatError] };
                        headerYielded = true; // Mark headers as yielded (even with error)
                        rowNumber++; // Increment before skipping
                        continue;
                    }

                    // Check field count consistency
                    if (rawFields.length !== headers.length) {
                        const formatError: CsvtError = {
                            type: 'format',
                            message: `Incorrect number of fields. Expected ${headers.length}, got ${rawFields.length}.`,
                            row: rowNumber,
                            value: line,
                        };
                        if (errorMode === 'strict') throw formatError;
                        // Yield error wrapped in result
                        yield { data: [], headers: headerYielded ? [] : headers, errors: [formatError] };
                        headerYielded = true; // Mark headers as yielded (even with error)
                        rowNumber++; // Increment before skipping
                        continue;
                    }

                    const rowData: Record<string, unknown> = {};
                    const rowErrors: CsvtError[] = [];
                    let hasFatalErrorForRow = false; // For collect/substitute: constraint errors prevent yielding data

                    for (let i = 0; i < headers.length; i++) {
                        const header = headers[i]!;
                        const rawValue = rawFields[i]!;
                        // DEBUG: Log row number before validation
                        // console.log(`[DEBUG] Validating row: ${rowNumber}, col: ${i + 1}`);
                        const validationResult = validateAndConvert(rawValue, header, rowNumber);

                        if (validationResult.error) {
                            // DEBUG: Log detected error object
                            // console.log(`[DEBUG] Error detected:`, JSON.stringify(validationResult.error));
                            rowErrors.push(validationResult.error);
                            if (errorMode === 'strict') {
                                throw validationResult.error; // Throw first error in strict mode
                            }
                            // Check for fatal errors in non-strict modes
                            if (validationResult.error.type === 'constraint') {
                                hasFatalErrorForRow = true;
                            }
                            // In substituteNull mode, try to use null for type errors
                            if (errorMode === 'substituteNull' && validationResult.error.type === 'type' && !header.isNonNull) {
                                rowData[header.name] = null;
                            } else if (errorMode !== 'substituteNull') {
                                // In collect mode, any error makes the row invalid for data yielding
                                hasFatalErrorForRow = true;
                            }
                             // If substituteNull and it's a non-nullable type error, hasFatalErrorForRow remains true
                             else if (errorMode === 'substituteNull' && validationResult.error.type === 'type' && header.isNonNull) {
                                hasFatalErrorForRow = true;
                             }

                        } else {
                            // Success
                            rowData[header.name] = validationResult.value;
                        }
                    }

                    // Yield result (either data or errors)
                    if (rowErrors.length > 0 && hasFatalErrorForRow) {
                        // Yield errors because the row is invalid for data yielding
                         yield { data: [], headers: headerYielded ? [] : headers, errors: rowErrors };
                         headerYielded = true;
                    } else if (rowErrors.length > 0 && errorMode === 'substituteNull' && !hasFatalErrorForRow) {
                         // Yield data (with nulls substituted) AND the non-fatal errors
                         const resultData = rowData as T;
                         yield { data: [resultData], headers: headerYielded ? [] : headers, errors: rowErrors };
                         headerYielded = true;
                    } else if (rowErrors.length === 0) {
                         // Yield successful data row
                         const resultData = rowData as T;
                         yield { data: [resultData], headers: headerYielded ? [] : headers, errors: [] };
                         headerYielded = true;
                    }
                    // If collect mode and rowErrors.length > 0 but !hasFatalErrorForRow -> this shouldn't happen with current logic

                    // --- Revised Increment Logic --- >>
                    // Increment row number AFTER yielding the result for that line
                    rowNumber++;
                    // << --- End Revised Logic ---
                }
                 // else: Headers failed to parse, and we are not in strict mode, loop should have terminated
            }
            // Remove debug log
            // console.log(`[DEBUG] Exited inner loop. Buffer: "${buffer.replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"`);

            if (done) {
                // Remove debug log
                // console.log(`[DEBUG] Stream processing finished (done=true). Final buffer: "${buffer.replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"`);
                break; // Exit loop when stream is finished
            }
        }

    } catch (error) {
        // Handle ONLY potential stream reading errors or unexpected errors.
        // CsvtError thrown in strict mode should be caught by the consumer's loop.
        // Errors in collect/substitute modes are yielded, not thrown.

        // Basic check if it looks like our CSVT error or a generic Error
        let isCsvtParseError = false;
        if (error instanceof Object && 'type' in error && 'row' in error) {
            isCsvtParseError = true;
        }

        if (!isCsvtParseError && error instanceof Error) {
            // Remove console.error
            // console.error('Unexpected stream processing error:', error);
            throw error;
        } else if (isCsvtParseError) {
            // If it IS a CsvtError, and we are here, it means strict mode *didn't* throw it earlier
            // OR something unexpected happened. Log it, but don't suppress it if strict mode should've thrown.
            // This path shouldn't ideally be hit for strict mode errors.
            // console.error('[Internal Error] Caught CsvtError in outer catch block:', error);
             if (errorMode === 'strict') {
                 throw error;
             }
             // Otherwise, in collect/substitute, errors are yielded, so reaching here is unexpected.
        }
         // Handle non-Error throws? For now, let them propagate.

    } finally {
        reader.releaseLock();
    }
}

/**
 * Writes an iterable of objects to a CSVT format stream.
 *
 * @param data An Iterable or AsyncIterable of record objects.
 * @param options Configuration options for writing.
 * @returns A ReadableStream that yields Uint8Array chunks of the CSVT data.
 */
export function writeCsvtStream<T extends Record<string, any>>(
    data: Iterable<T> | AsyncIterable<T>,
    options: WriteOptions = {},
): ReadableStream<Uint8Array> {
    const { headers: explicitHeaders, lineBreak = '\n', delimiter = ',' } = options;

    let headersDefined = false;
    let headersToWrite: ExplicitColumnHeader[] = explicitHeaders || [];

    const transformer = new TransformStream<T, string>({
        async transform(chunk, controller) {
            if (!headersDefined) {
                if (!explicitHeaders) {
                    // Infer headers from the first chunk using type inference
                    headersToWrite = Object.keys(chunk).map(key => {
                        const sampleValue = chunk[key];
                        let inferredType: string = 'string'; // Default to string

                        if (typeof sampleValue === 'number') {
                            inferredType = 'number';
                        } else if (typeof sampleValue === 'boolean') {
                            inferredType = 'bool';
                        } else if (sampleValue instanceof Date) {
                            inferredType = 'datetime'; // Represent Date objects as datetime
                        } else if (Array.isArray(sampleValue)) {
                            inferredType = 'array';
                        } else if (typeof sampleValue === 'object' && sampleValue !== null) {
                            inferredType = 'object';
                        }
                        // Note: Non-null constraints '!' are NOT inferred automatically.

                        return { name: key, type: inferredType };
                    });
                }
                if (headersToWrite.length > 0) {
                    const headerLine = headersToWrite.map(h => {
                        const escapedName = escapeHeaderName(h.name, delimiter);
                        return `${escapedName}:${h.type}`;
                    }).join(delimiter);
                    controller.enqueue(headerLine + lineBreak);
                    headersDefined = true;
                }
            }

            // Format data row
            if (headersToWrite.length > 0) {
                const values = headersToWrite.map(header => {
                    const rawValue = chunk[header.name];
                    const serialized = serializeValue(rawValue);
                    const escaped = escapeCsvField(serialized, delimiter);
                    return escaped;
                });
                controller.enqueue(values.join(delimiter) + lineBreak);
            }
        },
        flush(controller) {
            if (!headersDefined && explicitHeaders && explicitHeaders.length > 0) {
                 headersToWrite = explicitHeaders;
                 const headerLine = headersToWrite.map(h => {
                     const escapedName = escapeHeaderName(h.name, delimiter);
                     return `${escapedName}:${h.type}`;
                 }).join(delimiter);
                 controller.enqueue(headerLine + lineBreak);
                 headersDefined = true;
            } else if (!headersDefined) {
                 // Remove console.warn
                 // console.warn('[CSVT] writeCsvtStream: No headers defined and no data provided.');
            }
        }
    });

    // Create a source stream from the iterable/async iterable
    let iterator: AsyncIterator<T> | Iterator<T> | undefined;
    const sourceStream = new ReadableStream<T>({
        // iterator: undefined as AsyncIterator<T> | undefined, // Remove property
        async start(controller) {
            if (Symbol.iterator in data && typeof data[Symbol.iterator] === 'function') {
                // Synchronous Iterable
                iterator = data[Symbol.iterator]();
                try {
                    // Immediately push all sync items
                    let result = iterator.next();
                    while (!result.done) {
                        controller.enqueue(result.value);
                        result = iterator.next();
                    }
                    controller.close();
                } catch (err) {
                    controller.error(err);
                }
            } else if (Symbol.asyncIterator in data && typeof data[Symbol.asyncIterator] === 'function') {
                // AsyncIterable - Store iterator for pull
                iterator = data[Symbol.asyncIterator]();
            } else {
                 controller.error(new Error('Input data must be an Iterable or AsyncIterable.'));
            }
        },
        async pull(controller) {
            if (!iterator || typeof (iterator as AsyncIterator<T>).next !== 'function') {
                 // Only handle pull for async iterators
                 // Sync iterators are handled entirely in start
                 return;
            }
            // AsyncIterable logic
            try {
                // Assert as AsyncIterator since sync case is handled in start
                const asyncIterator = iterator as AsyncIterator<T>; 
                const { value, done } = await asyncIterator.next();
                if (done) {
                    controller.close();
                } else {
                    controller.enqueue(value);
                }
            } catch (err) {
                controller.error(err);
            }
        },
        cancel(_reason) {
             // Check if iterator exists and has a return method
             if (iterator && typeof (iterator as any).return === 'function') {
                 try {
                     (iterator as any).return();
                 } catch (err) {
                     // Ignore errors during cancellation cleanup?
                 }
             }
        },
    });

    // Pipe the source through the transformer
    const stringStream: ReadableStream<string> = sourceStream.pipeThrough(transformer);

    // Pipe the string stream through a text encoder
    return stringStream.pipeThrough(new TextEncoderStream());
} 
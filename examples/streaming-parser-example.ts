// examples/streaming-parser-example.ts
import { parseCsvtStream, type CsvtParsedResult, type CsvtError } from '../src/index'; // Adjust path if testing locally before publishing
import { Readable } from 'stream';

// Remove Helper type guard
// function isParsedResult<T>(obj: any): obj is CsvtParsedResult<T> {
//   return obj && typeof obj === 'object' && Array.isArray(obj.data) && Array.isArray(obj.errors);
// }

async function runStreamingParserExample() {
  console.log('--- Streaming Parser Example ---');

  // Sample CSVT data as a string
  const csvtData = `id:number!, "User Name":string, score:number, registered:bool
1,"Alice",95,true
2,"Bob, ""The Builder""",,false
invalid-row
4,"Charlie",88,true
5,Invalid Bool,90,maybe`;

  // Create a Node.js Readable stream from the string
  const nodeReadable = Readable.from(csvtData);

  // Convert Node.js Readable to Web Streams API ReadableStream and cast
  const webReadableStream = Readable.toWeb(nodeReadable) as ReadableStream<Uint8Array>; // Cast here

  try {
    // Parse the stream using parseCsvtStream (default 'strict' mode)
    console.log('\nParsing in strict mode...');
    const streamIteratorStrict = parseCsvtStream(webReadableStream, { errorMode: 'strict' });

    for await (const result of streamIteratorStrict) {
      // No type guard needed - result is always CsvtParsedResult<T>
      console.log('Strict - Data:', result.data);
      console.log('Strict - Headers:', result.headers); // Headers are included in each result
      // Errors array will be empty here as strict mode throws on error
    }
    console.log('Strict mode finished successfully (or stream was empty).');

  } catch (error: any) {
    console.error('Strict mode failed as expected:', error.message);
    // Example: Strict mode failed as expected: Invalid row format: Expected 4 columns, but found 1 at row 4
  }


  // --- Example with 'collect' error mode ---
  console.log('\nParsing in collect mode...');

  // Need to recreate the stream as it's consumed
  const nodeReadableCollect = Readable.from(csvtData);
  const webReadableStreamCollect = Readable.toWeb(nodeReadableCollect) as ReadableStream<Uint8Array>; // Cast here

  const streamIteratorCollect = parseCsvtStream(webReadableStreamCollect, { errorMode: 'collect' });

  let headersCollected: any[] | undefined;
  const allDataCollected: any[] = [];
  const allErrorsCollected: any[] = [];

  for await (const result of streamIteratorCollect) {
    // No type guard needed
    if (result.headers && result.headers.length > 0 && !headersCollected) {
      headersCollected = result.headers;
      console.log('Collect - Headers:', headersCollected);
    }
    if (result.data.length > 0) {
      // Each result typically contains one row's data
      allDataCollected.push(...result.data);
    }
    if (result.errors.length > 0) {
      // Errors specific to the processed chunk/row
      allErrorsCollected.push(...result.errors);
    }
  }

  console.log('Collect - All Parsed Data:', allDataCollected);
  console.log('Collect - All Errors:', allErrorsCollected);
  /* Example Output Snippet:
  Collect - All Parsed Data: [
    { id: 1, 'User Name': 'Alice', score: 95, registered: true },
    { id: 2, 'User Name': 'Bob, "The Builder"', score: null, registered: false },
    { id: 4, 'User Name': 'Charlie', score: 88, registered: true }
  ]
  Collect - All Errors: [
    { type: 'format', message: '...', row: 4, ... },
    { type: 'type', message: '...', row: 6, column: 4, ... }
  ]
  */

  console.log('\n--- End of Streaming Parser Example ---');
}

runStreamingParserExample().catch(console.error); 
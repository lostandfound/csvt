// examples/streaming-writer-example.ts
import { writeCsvtStream } from '../src/index'; // Adjust path if testing locally
import { Readable } from 'stream';

// Helper function to read a Web ReadableStream into a string
async function streamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  result += decoder.decode(); // Flush any remaining bytes
  return result;
}

// Sample data (synchronous iterable - Array)
const syncData = [
  { id: 1, name: 'Alice', score: 95.5, tags: ['A', 'B'], registered: true, joined: new Date('2023-01-15T10:00:00Z') },
  { id: 2, name: 'Bob, "Jr."', score: null, tags: ['C'], registered: false, joined: new Date('2023-02-20T11:30:00Z') },
  { id: 3, name: 'Charlie', score: 88, tags: [], registered: true, joined: new Date('2023-03-10T09:15:00Z') },
];

// Sample data source (asynchronous iterable - AsyncGenerator)
async function* generateAsyncData() {
  yield { product: 'Laptop', price: 1200.50, category: 'Electronics', inStock: true };
  await new Promise(resolve => setTimeout(resolve, 10)); // Simulate async delay
  yield { product: 'Mouse', price: 25.99, category: 'Electronics', inStock: true };
  await new Promise(resolve => setTimeout(resolve, 10));
  yield { product: 'Keyboard', price: 75.00, category: 'Electronics', inStock: false };
  yield { product: 'Desk Chair', price: 150.75, category: 'Furniture', inStock: null }; // null value
}

async function runStreamingWriterExample() {
  console.log('--- Streaming Writer Example ---');

  // --- Example 1: Writing from Synchronous Data (Array) with Inferred Headers ---
  console.log('\nWriting from Sync Data (Inferred Headers)...');
  const writeStreamSyncInferred = writeCsvtStream(syncData);
  const csvtStringSyncInferred = await streamToString(writeStreamSyncInferred);
  console.log('Output:\n', csvtStringSyncInferred);
  /* Example Output:
  id:number,name:string,score:number,tags:array,registered:bool,joined:datetime
  1,Alice,95.5,"[""A"",""B""]",true,2023-01-15T10:00:00.000Z
  2,"Bob, ""Jr.""",,"[""C""]",false,2023-02-20T11:30:00.000Z
  3,Charlie,88,"[]",true,2023-03-10T09:15:00.000Z
  */

  // --- Example 2: Writing from Synchronous Data (Array) with Explicit Headers ---
  console.log('\nWriting from Sync Data (Explicit Headers - date type for joined)...');
  const writeStreamSyncExplicit = writeCsvtStream(syncData, {
    headers: [
      { name: 'id', type: 'number!' }, // Use 'number!' directly
      { name: 'name', type: 'string' },
      { name: 'score', type: 'number' },
      { name: 'joined', type: 'date' }, // Use 'date' type instead of inferred 'datetime'
      // 'tags' and 'registered' columns are omitted
    ]
  });
  const csvtStringSyncExplicit = await streamToString(writeStreamSyncExplicit);
  console.log('Output:\n', csvtStringSyncExplicit);
  /* Example Output:
  id:number!,name:string,score:number,joined:date
  1,Alice,95.5,2023-01-15
  2,"Bob, ""Jr.""",,2023-02-20
  3,Charlie,88,2023-03-10
  */

  // --- Example 3: Writing from Asynchronous Data (AsyncGenerator) with Inferred Headers ---
  console.log('\nWriting from Async Data (Inferred Headers)...');
  const writeStreamAsyncInferred = writeCsvtStream(generateAsyncData());
  const csvtStringAsyncInferred = await streamToString(writeStreamAsyncInferred);
  console.log('Output:\n', csvtStringAsyncInferred);
  /* Example Output:
  product:string,price:number,category:string,inStock:bool
  Laptop,1200.5,Electronics,true
  Mouse,25.99,Electronics,true
  Keyboard,75,Electronics,false
  "Desk Chair",150.75,Furniture,
  */

  console.log('\n--- End of Streaming Writer Example ---');
}

runStreamingWriterExample().catch(console.error); 